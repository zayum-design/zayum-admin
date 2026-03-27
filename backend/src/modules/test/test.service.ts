import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { SysTest } from '../../entities/sys-test.entity';
import { CreateSysTestDto } from './dto/create-test.dto';
import { UpdateSysTestDto } from './dto/update-test.dto';
import { QuerySysTestDto } from './dto/query-test.dto';

@Injectable()
export class SysTestService {
  constructor(
    @InjectRepository(SysTest)
    private testRepository: Repository<SysTest>,
  ) {}

  async findAll(query: QuerySysTestDto) {
    const { page = 1, pageSize = 10 } = query;
    
    const where: any = {};
    
    // TODO: 添加查询条件
    
    const [list, total] = await this.testRepository.findAndCount({
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
    const item = await this.testRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('记录不存在');
    }
    return item;
  }

  async create(createDto: CreateSysTestDto) {
    const item = this.testRepository.create(createDto);
    return this.testRepository.save(item);
  }

  async update(id: number, updateDto: UpdateSysTestDto) {
    const item = await this.findOne(id);
    Object.assign(item, updateDto);
    return this.testRepository.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    await this.testRepository.remove(item);
    return { message: '删除成功' };
  }
}