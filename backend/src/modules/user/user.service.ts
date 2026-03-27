import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, FindOptionsWhere, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SysUser } from '../../entities/sys-user.entity';
import { SysUserGroup } from '../../entities/sys-user-group.entity';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';
import { QueryUserDto } from './dto/query-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserScoreService } from '../user-score/user-score.service';
import { UserBalanceService } from '../user-balance/user-balance.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(SysUser)
    private userRepository: Repository<SysUser>,
    @InjectRepository(SysUserGroup)
    private userGroupRepository: Repository<SysUserGroup>,
    @InjectRepository(SysOperationLog)
    private operationLogRepository: Repository<SysOperationLog>,
    private userScoreService: UserScoreService,
    private userBalanceService: UserBalanceService,
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
      score_min,
      score_max,
      balance_min,
      balance_max,
    } = query;

    const where: FindOptionsWhere<SysUser> = {};

    if (username) where.username = Like(`%${username}%`);
    if (nickname) where.nickname = Like(`%${nickname}%`);
    if (email) where.email = Like(`%${email}%`);
    if (mobile) where.mobile = Like(`%${mobile}%`);
    if (group_id) where.groupId = group_id;
    if (gender) where.gender = gender;
    if (status) where.status = status;
    
    // 处理积分范围查询
    if (score_min !== undefined && score_max !== undefined) {
      where.score = Between(score_min, score_max);
    } else if (score_min !== undefined) {
      where.score = MoreThanOrEqual(score_min);
    } else if (score_max !== undefined) {
      where.score = LessThanOrEqual(score_max);
    }
    
    // 处理余额范围查询
    if (balance_min !== undefined && balance_max !== undefined) {
      where.balance = Between(balance_min, balance_max);
    } else if (balance_min !== undefined) {
      where.balance = MoreThanOrEqual(balance_min);
    } else if (balance_max !== undefined) {
      where.balance = LessThanOrEqual(balance_max);
    }

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
      score: createUserDto.score || 0,
      balance: createUserDto.balance || 0,
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

  async updateScore(id: number, score: number, operatorId: number, remark?: string) {
    if (typeof score !== 'number' || score < 0) {
      throw new BadRequestException('积分必须是非负数');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const oldScore = user.score;
    const changeScore = score - oldScore;
    user.score = score;
    const updatedUser = await this.userRepository.save(user);

    // 记录积分变动日志
    try {
      await this.userScoreService.addLog({
        user_id: id,
        admin_id: operatorId,
        scene: 'admin_update',
        change_score: Number(changeScore.toFixed(2)),
        before_score: Number(oldScore.toFixed(2)),
        after_score: Number(score.toFixed(2)),
        remark: remark || `管理员修改用户积分: ${oldScore} -> ${score}`,
      });
    } catch (error) {
      console.error('记录积分日志失败:', error);
    }

    // 记录操作日志
    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'user',
      action: 'update_score',
      method: 'PATCH',
      url: `/api/users/${id}/score`,
      params: JSON.stringify({ id, oldScore, newScore: score }),
      status: 'success',
    });

    const { password, ...rest } = updatedUser;
    return rest;
  }

  async updateBalance(id: number, balance: number, operatorId: number, remark?: string) {
    if (typeof balance !== 'number' || balance < 0) {
      throw new BadRequestException('余额必须是非负数');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const oldBalance = Number(user.balance);
    const changeBalance = balance - oldBalance;
    user.balance = balance;
    const updatedUser = await this.userRepository.save(user);

    // 记录余额变动日志
    try {
      await this.userBalanceService.addLog({
        user_id: id,
        admin_id: operatorId,
        scene: 'admin_update',
        change_balance: Number(changeBalance.toFixed(2)),
        before_balance: Number(oldBalance.toFixed(2)),
        after_balance: Number(balance.toFixed(2)),
        remark: remark || `管理员修改用户余额: ${oldBalance} -> ${balance}`,
      });
    } catch (error) {
      console.error('记录余额日志失败:', error);
    }

    // 记录操作日志
    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'user',
      action: 'update_balance',
      method: 'PATCH',
      url: `/api/users/${id}/balance`,
      params: JSON.stringify({ id, oldBalance, newBalance: balance }),
      status: 'success',
    });

    const { password, ...rest } = updatedUser;
    return rest;
  }

  async adjustScore(id: number, delta: number, operatorId: number, remark?: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const oldScore = user.score;
    const newScore = oldScore + delta;
    
    if (newScore < 0) {
      throw new BadRequestException('调整后积分不能为负数');
    }

    user.score = newScore;
    const updatedUser = await this.userRepository.save(user);

    // 记录积分变动日志
    try {
      await this.userScoreService.addLog({
        user_id: id,
        admin_id: operatorId,
        scene: delta >= 0 ? 'admin_add' : 'admin_deduct',
        change_score: Number(delta.toFixed(2)),
        before_score: Number(oldScore.toFixed(2)),
        after_score: Number(newScore.toFixed(2)),
        remark: remark || `管理员${delta >= 0 ? '增加' : '扣除'}用户积分: ${delta > 0 ? '+' : ''}${delta}`,
      });
    } catch (error) {
      console.error('记录积分日志失败:', error);
    }

    // 记录操作日志
    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'user',
      action: 'adjust_score',
      method: 'PATCH',
      url: `/api/users/${id}/adjust-score`,
      params: JSON.stringify({ id, delta, oldScore, newScore }),
      status: 'success',
    });

    const { password, ...rest } = updatedUser;
    return { ...rest, oldScore, newScore, delta };
  }

  async adjustBalance(id: number, delta: number, operatorId: number, remark?: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const oldBalance = Number(user.balance);
    const newBalance = oldBalance + delta;
    
    if (newBalance < 0) {
      throw new BadRequestException('调整后余额不能为负数');
    }

    user.balance = newBalance;
    const updatedUser = await this.userRepository.save(user);

    // 记录余额变动日志
    try {
      await this.userBalanceService.addLog({
        user_id: id,
        admin_id: operatorId,
        scene: delta >= 0 ? 'admin_recharge' : 'admin_deduct',
        change_balance: Number(delta.toFixed(2)),
        before_balance: Number(oldBalance.toFixed(2)),
        after_balance: Number(newBalance.toFixed(2)),
        remark: remark || `管理员${delta >= 0 ? '充值' : '扣除'}用户余额: ${delta > 0 ? '+' : ''}${delta}`,
      });
    } catch (error) {
      console.error('记录余额日志失败:', error);
    }

    // 记录操作日志
    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'user',
      action: 'adjust_balance',
      method: 'PATCH',
      url: `/api/users/${id}/adjust-balance`,
      params: JSON.stringify({ id, delta, oldBalance, newBalance }),
      status: 'success',
    });

    const { password, ...rest } = updatedUser;
    return { ...rest, oldBalance, newBalance, delta };
  }
}
