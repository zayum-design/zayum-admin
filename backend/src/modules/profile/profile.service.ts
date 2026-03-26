import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SysAdmin } from '../../entities/sys-admin.entity';
import { SysUser } from '../../entities/sys-user.entity';
import { SysAdminGroup } from '../../entities/sys-admin-group.entity';
import { SysUserGroup } from '../../entities/sys-user-group.entity';
import { SysLoginLog } from '../../entities/sys-login-log.entity';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(SysAdmin)
    private adminRepository: Repository<SysAdmin>,
    @InjectRepository(SysUser)
    private userRepository: Repository<SysUser>,
    @InjectRepository(SysAdminGroup)
    private adminGroupRepository: Repository<SysAdminGroup>,
    @InjectRepository(SysUserGroup)
    private userGroupRepository: Repository<SysUserGroup>,
    @InjectRepository(SysLoginLog)
    private loginLogRepository: Repository<SysLoginLog>,
    @InjectRepository(SysOperationLog)
    private operationLogRepository: Repository<SysOperationLog>,
  ) {}

  async getProfile(userId: number, userType: string) {
    if (userType === 'admin') {
      const admin = await this.adminRepository.findOne({
        where: { id: userId },
      });
      if (!admin) {
        throw new BadRequestException('用户不存在');
      }

      const group = await this.adminGroupRepository.findOne({
        where: { id: admin.groupId },
      });

      return {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        email: admin.email,
        mobile: admin.mobile,
        avatar: admin.avatar,
        gender: 'unknown',
        birthday: null,
        groupId: admin.groupId,
        groupName: group?.name || '',
        status: admin.status,
        loginAt: admin.loginAt,
        loginIp: admin.loginIp,
        createdAt: admin.createdAt,
        userType: 'admin',
      };
    } else {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new BadRequestException('用户不存在');
      }

      const group = await this.userGroupRepository.findOne({
        where: { id: user.groupId },
      });

      return {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        mobile: user.mobile,
        avatar: user.avatar,
        gender: user.gender,
        birthday: user.birthday,
        groupId: user.groupId,
        groupName: group?.name || '',
        status: user.status,
        loginAt: null,
        loginIp: null,
        createdAt: user.createdAt,
        userType: 'user',
      };
    }
  }

  async updateProfile(userId: number, userType: string, dto: UpdateProfileDto) {
    if (userType === 'admin') {
      const admin = await this.adminRepository.findOne({ where: { id: userId } });
      if (!admin) {
        throw new BadRequestException('用户不存在');
      }

      // 检查邮箱唯一性
      if (dto.email && dto.email !== admin.email) {
        const existing = await this.adminRepository.findOne({ where: { email: dto.email } });
        if (existing) {
          throw new BadRequestException('邮箱已被使用');
        }
      }

      // 检查手机号唯一性
      if (dto.mobile && dto.mobile !== admin.mobile) {
        const existing = await this.adminRepository.findOne({ where: { mobile: dto.mobile } });
        if (existing) {
          throw new BadRequestException('手机号已被使用');
        }
      }

      Object.assign(admin, dto);
      await this.adminRepository.save(admin);

      return this.getProfile(userId, userType);
    } else {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('用户不存在');
      }

      // 检查邮箱唯一性
      if (dto.email && dto.email !== user.email) {
        const existing = await this.userRepository.findOne({ where: { email: dto.email } });
        if (existing) {
          throw new BadRequestException('邮箱已被使用');
        }
      }

      // 检查手机号唯一性
      if (dto.mobile && dto.mobile !== user.mobile) {
        const existing = await this.userRepository.findOne({ where: { mobile: dto.mobile } });
        if (existing) {
          throw new BadRequestException('手机号已被使用');
        }
      }

      Object.assign(user, dto);
      await this.userRepository.save(user);

      return this.getProfile(userId, userType);
    }
  }

  async changePassword(userId: number, userType: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('确认密码与新密码不一致');
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException('新密码不能与旧密码相同');
    }

    if (userType === 'admin') {
      const admin = await this.adminRepository.findOne({ where: { id: userId } });
      if (!admin) {
        throw new BadRequestException('用户不存在');
      }

      // 验证旧密码
      const isMatch = await bcrypt.compare(dto.oldPassword, admin.password);
      if (!isMatch) {
        throw new UnauthorizedException('旧密码错误');
      }

      // 更新密码
      admin.password = await bcrypt.hash(dto.newPassword, 10);
      await this.adminRepository.save(admin);
    } else {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('用户不存在');
      }

      // 验证旧密码
      const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('旧密码错误');
      }

      // 更新密码
      user.password = await bcrypt.hash(dto.newPassword, 10);
      await this.userRepository.save(user);
    }

    return { message: '密码修改成功，请重新登录' };
  }

  async getLoginLogs(userId: number, userType: string, page: number = 1, pageSize: number = 10) {
    const where = { userId, userType };

    const [list, total] = await this.loginLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getOperationLogs(userId: number, userType: string, page: number = 1, pageSize: number = 10) {
    const where = { userId, userType };

    const [list, total] = await this.operationLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
