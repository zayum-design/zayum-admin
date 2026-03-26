import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SysUser } from '../../entities/sys-user.entity';
import { SysUserGroup } from '../../entities/sys-user-group.entity';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';
import { QueryUserDto } from './dto/query-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(SysUser)
    private userRepository: Repository<SysUser>,
    @InjectRepository(SysUserGroup)
    private userGroupRepository: Repository<SysUserGroup>,
    @InjectRepository(SysOperationLog)
    private operationLogRepository: Repository<SysOperationLog>,
  ) {}

  async findAll(query: QueryUserDto) {
    const {
      page = 1,
      pageSize = 10,
      username,
      nickname,
      email,
      mobile,
      group_id,
      gender,
      status,
      created_at_start,
      created_at_end,
    } = query;

    const where: FindOptionsWhere<SysUser> = {};

    if (username) where.username = Like(`%${username}%`);
    if (nickname) where.nickname = Like(`%${nickname}%`);
    if (email) where.email = Like(`%${email}%`);
    if (mobile) where.mobile = Like(`%${mobile}%`);
    if (group_id) where.groupId = group_id;
    if (gender) where.gender = gender;
    if (status) where.status = status;


    const [list, total] = await this.userRepository.findAndCount({
      where,
      relations: ['group'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const result = list.map((user) => {
      const { password, ...rest } = user;
      return {
        ...rest,
        group_id: user.groupId,
        group_name: user.group?.name,
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
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['group'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const { password, ...rest } = user;
    return {
      ...rest,
      group_id: user.groupId,
      group_name: user.group?.name,
    };
  }

  async create(createUserDto: CreateUserDto, operatorId: number) {
    // 检查用户名唯一性
    const existingUsername = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUsername) {
      throw new BadRequestException('用户名已存在');
    }

    // 检查邮箱唯一性
    const existingEmail = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingEmail) {
      throw new BadRequestException('邮箱已被使用');
    }

    // 检查手机号唯一性
    const existingMobile = await this.userRepository.findOne({
      where: { mobile: createUserDto.mobile },
    });
    if (existingMobile) {
      throw new BadRequestException('手机号已被使用');
    }

    // 检查用户组是否存在
    const group = await this.userGroupRepository.findOne({
      where: { id: createUserDto.group_id },
    });
    if (!group) {
      throw new BadRequestException('用户组不存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      username: createUserDto.username,
      nickname: createUserDto.nickname,
      password: hashedPassword,
      email: createUserDto.email,
      mobile: createUserDto.mobile,
      groupId: createUserDto.group_id,
      avatar: createUserDto.avatar,
      gender: createUserDto.gender || 'unknown',
      birthday: createUserDto.birthday,
      status: createUserDto.status || 'normal',
    });

    const savedUser = await this.userRepository.save(user);

    // 记录操作日志
    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'user',
      action: 'create',
      method: 'POST',
      url: '/api/users',
      params: JSON.stringify({ ...createUserDto, password: '[REDACTED]' }),
      status: 'success',
    });

    const { password, ...rest } = savedUser;
    return rest;
  }

  async update(id: number, updateUserDto: UpdateUserDto, operatorId: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查邮箱唯一性
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingEmail) {
        throw new BadRequestException('邮箱已被使用');
      }
    }

    // 检查手机号唯一性
    if (updateUserDto.mobile && updateUserDto.mobile !== user.mobile) {
      const existingMobile = await this.userRepository.findOne({
        where: { mobile: updateUserDto.mobile },
      });
      if (existingMobile) {
        throw new BadRequestException('手机号已被使用');
      }
    }

    // 如果修改了组
    if (updateUserDto.group_id && updateUserDto.group_id !== user.groupId) {
      const group = await this.userGroupRepository.findOne({
        where: { id: updateUserDto.group_id },
      });
      if (!group) {
        throw new BadRequestException('用户组不存在');
      }
    }

    // 如果修改了密码
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    // 记录操作日志
    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'user',
      action: 'update',
      method: 'PUT',
      url: `/api/users/${id}`,
      params: JSON.stringify(updateUserDto),
      status: 'success',
    });

    const { password, ...rest } = updatedUser;
    return rest;
  }

  async remove(id: number, operatorId: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.userRepository.remove(user);

    // 记录操作日志
    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'user',
      action: 'delete',
      method: 'DELETE',
      url: `/api/users/${id}`,
      params: JSON.stringify({ id }),
      status: 'success',
    });

    return { message: '删除成功' };
  }

  async batchRemove(ids: number[], operatorId: number) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('请选择要删除的用户');
    }

    const users = await this.userRepository.findBy({ id: In(ids) });
    if (users.length !== ids.length) {
      throw new BadRequestException('部分用户不存在');
    }

    await this.userRepository.remove(users);

    // 记录操作日志
    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'user',
      action: 'batch_delete',
      method: 'DELETE',
      url: '/api/users/batch',
      params: JSON.stringify({ ids }),
      status: 'success',
    });

    return { message: '批量删除成功' };
  }

  async updateStatus(id: number, status: string, operatorId: number) {
    if (!['normal', 'hidden', 'locked'].includes(status)) {
      throw new BadRequestException('无效的状态值');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.status = status;
    await this.userRepository.save(user);

    // 记录操作日志
    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'user',
      action: 'update_status',
      method: 'PATCH',
      url: `/api/users/${id}/status`,
      params: JSON.stringify({ status }),
      status: 'success',
    });

    return { message: '状态更新成功' };
  }

  async resetPassword(id: number, newPassword?: string, operatorId?: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const password = newPassword || this.generateRandomPassword();
    user.password = await bcrypt.hash(password, 10);
    await this.userRepository.save(user);

    // 记录操作日志
    if (operatorId) {
      await this.operationLogRepository.save({
        userType: 'admin',
        userId: operatorId,
        username: 'system',
        module: 'user',
        action: 'reset_password',
        method: 'POST',
        url: `/api/users/${id}/reset-password`,
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
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return this.generateRandomPassword();
    }
    return password;
  }
}
