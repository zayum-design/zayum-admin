import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { SysUserBalanceEntity } from '../../entities/sys-user-balance.entity';
import { CreateUserBalanceDto } from './dto/create-user-balance.dto';
import { UpdateUserBalanceDto } from './dto/update-user-balance.dto';
import { QueryUserBalanceDto } from './dto/query-user-balance.dto';

export interface AddBalanceLogParams {
  user_id: number;
  admin_id?: number;
  scene: string;
  change_balance: number;
  before_balance: number;
  after_balance: number;
  remark?: string;
  order_no?: string;
  ip?: string;
}

@Injectable()
export class UserBalanceService {
  constructor(
    @InjectRepository(SysUserBalanceEntity)
    private readonly userBalanceRepository: Repository<SysUserBalanceEntity>,
  ) {}

  /**
   * 添加余额日志（供其他地方调用）
   * @param params 余额日志参数
   * @returns 创建的日志记录
   */
  async addLog(params: AddBalanceLogParams): Promise<SysUserBalanceEntity> {
    const entity = this.userBalanceRepository.create(params);
    return await this.userBalanceRepository.save(entity);
  }

  async create(createDto: CreateUserBalanceDto) {
    const entity = this.userBalanceRepository.create(createDto);
    return await this.userBalanceRepository.save(entity);
  }

  async findAll(queryDto: QueryUserBalanceDto) {
    const { page = 1, page_size = 20, user_id, admin_id, scene, order_no, start_time, end_time } = queryDto;
    
    const where: any = {};
    
    if (user_id) where.user_id = user_id;
    if (admin_id) where.admin_id = admin_id;
    if (scene) where.scene = scene;
    if (order_no) where.order_no = order_no;
    
    if (start_time && end_time) {
      where.created_at = Between(new Date(start_time), new Date(end_time));
    }
    
    const [list, total] = await this.userBalanceRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: (page - 1) * page_size,
      take: page_size,
    });
    
    return {
      list,
      total,
      page,
      page_size,
      total_pages: Math.ceil(total / page_size),
    };
  }

  async findOne(id: number) {
    return await this.userBalanceRepository.findOne({ where: { id } });
  }

  async update(id: number, updateDto: UpdateUserBalanceDto) {
    await this.userBalanceRepository.update(id, updateDto);
    return await this.findOne(id);
  }

  async remove(id: number) {
    return await this.userBalanceRepository.delete(id);
  }
}
