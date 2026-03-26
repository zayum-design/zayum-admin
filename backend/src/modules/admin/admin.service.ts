import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SysAdmin } from '../../entities/sys-admin.entity';
import { SysAdminGroup } from '../../entities/sys-admin-group.entity';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';
import { QueryAdminDto } from './dto/query-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(SysAdmin)
    private adminRepository: Repository<SysAdmin>,
    @InjectRepository(SysAdminGroup)
    private adminGroupRepository: Repository<SysAdminGroup>,
    @InjectRepository(SysOperationLog)
    private operationLogRepository: Repository<SysOperationLog>,
  ) {}

  async findAll(query: QueryAdminDto) {
    const { page = 1, pageSize = 10, username, nickname, email, mobile, group_id, status } = query;

    const where: FindOptionsWhere<SysAdmin> = {};

    if (username) where.username = Like(`%${username}%`);
    if (nickname) where.nickname = Like(`%${nickname}%`);
    if (email) where.email = Like(`%${email}%`);
    if (mobile) where.mobile = Like(`%${mobile}%`);
    if (group_id) where.groupId = group_id;
    if (status) where.status = status;

    const [list, total] = await this.adminRepository.findAndCount({
      where,
      relations: ['group'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 隐藏敏感字段
    const result = list.map((admin) => {
      const { password, token, loginFailure, ...rest } = admin;
      return {
        ...rest,
        group_id: admin.groupId,
        group_name: admin.group?.name,
      };
    });

    return {
      list: result,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['group'],
    });

    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    const { password, token, loginFailure, ...rest } = admin;
    return {
      ...rest,
      group_id: admin.groupId,
      group_name: admin.group?.name,
    };
  }

  async create(createAdminDto: CreateAdminDto, operatorId: number) {
    // 检查用户名唯一性
    const existingUsername = await this.adminRepository.findOne({
      where: { username: createAdminDto.username },
    });
    if (existingUsername) {
      throw new BadRequestException('用户名已存在');
    }

    // 检查邮箱唯一性
    const existingEmail = await this.adminRepository.findOne({
      where: { email: createAdminDto.email },
    });
    if (existingEmail) {
      throw new BadRequestException('邮箱已被使用');
    }

    // 检查手机号唯一性
    const existingMobile = await this.adminRepository.findOne({
      where: { mobile: createAdminDto.mobile },
    });
    if (existingMobile) {
      throw new BadRequestException('手机号已被使用');
    }

    // 检查管理员组是否存在
    const group = await this.adminGroupRepository.findOne({
      where: { id: createAdminDto.group_id },
    });
    if (!group) {
      throw new BadRequestException('管理员组不存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

    const admin = this.adminRepository.create({
      username: createAdminDto.username,
      nickname: createAdminDto.nickname,
      password: hashedPassword,
      email: createAdminDto.email,
      mobile: createAdminDto.mobile,
      groupId: createAdminDto.group_id,
      avatar: createAdminDto.avatar,
      status: createAdminDto.status || 'normal',
    });

    const savedAdmin = await this.adminRepository.save(admin);

    // 记录操作日志
    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'admin',
      action: 'create',
      method: 'POST',
      url: '/api/admins',
      params: JSON.stringify(createAdminDto),
      status: 'success',
    });

    const { password, token, loginFailure, ...rest } = savedAdmin;
    return rest;
  }

  async update(id: number, updateAdminDto: UpdateAdminDto, operatorId: number) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    // 不允许修改超级管理员的某些字段
    if (id === 1) {
      delete updateAdminDto.group_id;
      delete updateAdminDto.status;
    }

    // 检查邮箱唯一性
    if (updateAdminDto.email && updateAdminDto.email !== admin.email) {
      const existingEmail = await this.adminRepository.findOne({
        where: { email: updateAdminDto.email },
      });
      if (existingEmail) {
        throw new BadRequestException('邮箱已被使用');
      }
    }

    // 检查手机号唯一性
    if (updateAdminDto.mobile && updateAdminDto.mobile !== admin.mobile) {
      const existingMobile = await this.adminRepository.findOne({
        where: { mobile: updateAdminDto.mobile },
      });
      if (existingMobile) {
        throw new BadRequestException('手机号已被使用');
      }
    }

    // 如果修改了组
    if (updateAdminDto.group_id && updateAdminDto.group_id !== admin.groupId) {
      const group = await this.adminGroupRepository.findOne({
        where: { id: updateAdminDto.group_id },
      });
      if (!group) {
        throw new BadRequestException('管理员组不存在');
      }
    }

    // 如果修改了密码
    if (updateAdminDto.password) {
      updateAdminDto.password = await bcrypt.hash(updateAdminDto.password, 10);
    }

    Object.assign(admin, updateAdminDto);
    const updatedAdmin = await this.adminRepository.save(admin);

    // 记录操作日志
    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'admin',
      action: 'update',
      method: 'PUT',
      url: `/api/admins/${id}`,
      params: JSON.stringify(updateAdminDto),
      status: 'success',
    });

    const { password, token, loginFailure, ...rest } = updatedAdmin;
    return rest;
  }

  async remove(id: number, operatorId: number) {
    if (id === operatorId) {
      throw new BadRequestException('不能删除自己');
    }

    if (id === 1) {
      throw new BadRequestException('不能删除超级管理员');
    }

    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    await this.adminRepository.remove(admin);

    // 记录操作日志
    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'admin',
      action: 'delete',
      method: 'DELETE',
      url: `/api/admins/${id}`,
      params: JSON.stringify({ id }),
      status: 'success',
    });

    return { message: '删除成功' };
  }

  async updateStatus(id: number, status: string, operatorId: number) {
    if (id === operatorId) {
      throw new BadRequestException('不能修改自己的状态');
    }

    if (id === 1 && status === 'hidden') {
      throw new BadRequestException('不能禁用超级管理员');
    }

    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    admin.status = status;
    await this.adminRepository.save(admin);

    // 如果禁用，清除 token
    if (status === 'hidden') {
      admin.token = '';
      await this.adminRepository.save(admin);
    }

    // 记录操作日志
    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'admin',
      action: 'update_status',
      method: 'PATCH',
      url: `/api/admins/${id}/status`,
      params: JSON.stringify({ status }),
      status: 'success',
    });

    return { message: '状态更新成功' };
  }

  async resetPassword(id: number, newPassword?: string, operatorId?: number) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    const password = newPassword || this.generateRandomPassword();
    admin.password = await bcrypt.hash(password, 10);
    admin.token = ''; // 强制重新登录
    await this.adminRepository.save(admin);

    // 记录操作日志
    if (operatorId) {
      await this.operationLogRepository.save({
        userType: 'admin',
        userId: operatorId,
        username: 'system',
        module: 'admin',
        action: 'reset_password',
        method: 'POST',
        url: `/api/admins/${id}/reset-password`,
        params: JSON.stringify({ id }),
        status: 'success',
      });
    }

    return { password };
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // 确保包含字母和数字
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return this.generateRandomPassword();
    }
    return password;
  }
}
