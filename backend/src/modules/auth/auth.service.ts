import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SysAdmin } from '../../entities/sys-admin.entity';
import { SysLoginLog } from '../../entities/sys-login-log.entity';
import { SysRolePermission } from '../../entities/sys-role-permission.entity';
import { SysPermission } from '../../entities/sys-permission.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SysAdmin)
    private adminRepository: Repository<SysAdmin>,
    @InjectRepository(SysLoginLog)
    private loginLogRepository: Repository<SysLoginLog>,
    @InjectRepository(SysRolePermission)
    private rolePermissionRepository: Repository<SysRolePermission>,
    @InjectRepository(SysPermission)
    private permissionRepository: Repository<SysPermission>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<SysAdmin | null> {
    const admin = await this.adminRepository.findOne({
      where: { username },
      relations: ['group'],
    });

    if (!admin) {
      return null;
    }

    if (admin.status === 'hidden') {
      throw new UnauthorizedException('账号已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      admin.loginFailure += 1;
      await this.adminRepository.save(admin);
      return null;
    }

    return admin;
  }

  async login(loginDto: LoginDto, ip: string, userAgent: string) {
    const admin = await this.validateUser(loginDto.username, loginDto.password);

    if (!admin) {
      await this.loginLogRepository.save({
        userType: 'admin',
        userId: undefined,
        username: loginDto.username,
        ip,
        userAgent,
        status: 'failure',
        message: '用户名或密码错误',
      });
      throw new UnauthorizedException('用户名或密码错误');
    }

    admin.loginFailure = 0;
    admin.loginAt = new Date();
    admin.loginIp = ip;

    const payload = { sub: admin.id, username: admin.username };
    const token = this.jwtService.sign(payload);

    admin.token = token;
    await this.adminRepository.save(admin);

    await this.loginLogRepository.save({
      userType: 'admin',
      userId: admin.id,
      username: admin.username,
      ip,
      userAgent,
      status: 'success',
      message: '登录成功',
    });

    const { password, ...result } = admin;
    return {
      user: result,
      token: {
        access_token: token,
        token_type: 'Bearer',
        expires_in: 7200,
      },
    };
  }

  async logout(admin: SysAdmin) {
    admin.token = '';
    await this.adminRepository.save(admin);

    await this.loginLogRepository.save({
      userType: 'admin',
      userId: admin.id,
      username: admin.username,
      ip: admin.loginIp,
      status: 'success',
      message: '登出成功',
    });

    return { message: '登出成功' };
  }

  async getProfile(admin: SysAdmin) {
    const fullAdmin = await this.adminRepository.findOne({
      where: { id: admin.id },
      relations: ['group'],
    });

    if (!fullAdmin) {
      throw new UnauthorizedException('用户不存在');
    }

    const { password, token, ...result } = fullAdmin;
    return result;
  }

  async getPermissions(admin: SysAdmin) {
    // 加载admin的group关系（如果未加载）
    let adminWithGroup: SysAdmin = admin;
    if (!admin.group) {
      const adminWithGroupOrNull = await this.adminRepository.findOne({
        where: { id: admin.id },
        relations: ['group'],
      });
      if (!adminWithGroupOrNull) {
        throw new UnauthorizedException('用户不存在');
      }
      adminWithGroup = adminWithGroupOrNull;
    }

    // 检查组的permissions字段是否包含'*'
    let groupHasAllPermissions = false;
    if (adminWithGroup.group && adminWithGroup.group.permissions) {
      try {
        const groupPermissions = JSON.parse(adminWithGroup.group.permissions);
        groupHasAllPermissions = Array.isArray(groupPermissions) && groupPermissions.includes('*');
      } catch (e) {
        // JSON解析失败，忽略
      }
    }

    // 如果是超级管理员（groupId === 1）或组有'*'权限，返回所有权限
    if (Number(adminWithGroup.groupId) === 1 || groupHasAllPermissions) {
      const allPermissions = await this.permissionRepository.find({
        where: { status: 'normal' },
        order: { sort: 'ASC', id: 'ASC' },
      });
      // 返回 * 表示拥有所有权限
      return {
        permissions: allPermissions,
        codes: ['*', ...allPermissions.map((p) => p.code)],
      };
    }

    // 获取组的权限关联
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleType: 'admin_group', roleId: adminWithGroup.groupId },
    });

    const permissionIds = rolePermissions.map((rp) => rp.permissionId);
    if (permissionIds.length === 0) {
      return { permissions: [], codes: [] };
    }

    const permissions = await this.permissionRepository.findByIds(permissionIds);
    return {
      permissions,
      codes: permissions.map((p) => p.code),
    };
  }

  async getMenus(admin: SysAdmin) {
    // 如果是超级管理员，返回所有菜单
    if (Number(admin.groupId) === 1) {
      const menus = await this.permissionRepository.find({
        where: { type: 'menu', status: 'normal' },
        order: { sort: 'ASC', id: 'ASC' },
      });
      return this.buildMenuTree(menus);
    }

    // 获取用户的权限
    const { permissions } = await this.getPermissions(admin);
    const menus = permissions.filter((p) => p.type === 'menu');
    return this.buildMenuTree(menus);
  }

  private buildMenuTree(menus: SysPermission[]): any[] {
    const map = new Map<number, any>();
    const roots: any[] = [];

    menus.forEach((m) => {
      map.set(m.id, { ...m, children: [] });
    });

    menus.forEach((m) => {
      const node = map.get(m.id);
      if (m.parentId === 0 || !map.has(m.parentId)) {
        roots.push(node);
      } else {
        const parent = map.get(m.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    return roots;
  }
}
