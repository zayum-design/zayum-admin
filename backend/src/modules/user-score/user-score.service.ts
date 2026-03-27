import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { SysUserScoreEntity } from '../../entities/sys-user-score.entity';
import { CreateUserScoreDto } from './dto/create-user-score.dto';
import { UpdateUserScoreDto } from './dto/update-user-score.dto';
import { QueryUserScoreDto } from './dto/query-user-score.dto';

export interface AddScoreLogParams {
  user_id: number;
  admin_id?: number;
  scene: string;
  change_score: number;
  before_score: number;
  after_score: number;
  remark?: string;
  order_no?: string;
  ip?: string;
}

@Injectable()
export class UserScoreService {
  constructor(
    @InjectRepository(SysUserScoreEntity)
    private readonly userScoreRepository: Repository<SysUserScoreEntity>,
  ) {}

  /**
   * 添加积分日志（供其他地方调用）
   * @param params 积分日志参数
   * @returns 创建的日志记录
   */
  async addLog(params: AddScoreLogParams): Promise<SysUserScoreEntity> {
    const entity = this.userScoreRepository.create(params);
    return await this.userScoreRepository.save(entity);
  }

  async create(createDto: CreateUserScoreDto) {
    const entity = this.userScoreRepository.create(createDto);
    return await this.userScoreRepository.save(entity);
  }

  async findAll(queryDto: QueryUserScoreDto) {
    const { page = 1, page_size = 20, user_id, admin_id, scene, order_no, start_time, end_time } = queryDto;
    
    const where: any = {};
    
    if (user_id) where.user_id = user_id;
    if (admin_id) where.admin_id = admin_id;
    if (scene) where.scene = scene;
    if (order_no) where.order_no = order_no;
    
    if (start_time && end_time) {
      where.created_at = Between(new Date(start_time), new Date(end_time));
    }
    
    const [list, total] = await this.userScoreRepository.findAndCount({
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
    return await this.userScoreRepository.findOne({ where: { id } });
  }

  async update(id: number, updateDto: UpdateUserScoreDto) {
    await this.userScoreRepository.update(id, updateDto);
    return await this.findOne(id);
  }

  async remove(id: number) {
    return await this.userScoreRepository.delete(id);
  }
}