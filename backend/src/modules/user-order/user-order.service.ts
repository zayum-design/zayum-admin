import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { SysUserOrder } from '../../entities/sys-user-order.entity';
import { CreateSysUserOrderDto } from './dto/create-user-order.dto';
import { UpdateSysUserOrderDto } from './dto/update-user-order.dto';
import { QuerySysUserOrderDto } from './dto/query-user-order.dto';

@Injectable()
export class SysUserOrderService {
  constructor(
    @InjectRepository(SysUserOrder)
    private userOrderRepository: Repository<SysUserOrder>,
  ) {}

  async findAll(query: QuerySysUserOrderDto) {
    const { page = 1, pageSize = 10 } = query;
    
    const where: any = {};
    
    // TODO: 添加查询条件
    
    const [list, total] = await this.userOrderRepository.findAndCount({
      where,
      order: { id: 'DESC' },
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

  async findOne(id: number) {
    const item = await this.userOrderRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('记录不存在');
    }
    return item;
  }

  async create(createDto: CreateSysUserOrderDto) {
    const item = this.userOrderRepository.create(createDto);
    return this.userOrderRepository.save(item);
  }

  async update(id: number, updateDto: UpdateSysUserOrderDto) {
    const item = await this.findOne(id);
    Object.assign(item, updateDto);
    return this.userOrderRepository.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    await this.userOrderRepository.remove(item);
    return { message: '删除成功' };
  }
}