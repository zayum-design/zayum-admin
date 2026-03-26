import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { SysConfig } from '../../entities/sys-config.entity';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';
import { QueryConfigDto } from './dto/query-config.dto';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(SysConfig)
    private configRepository: Repository<SysConfig>,
    @InjectRepository(SysOperationLog)
    private operationLogRepository: Repository<SysOperationLog>,
  ) {}

  async findAll(query: QueryConfigDto) {
    const { page = 1, pageSize = 10, category, key, is_public } = query;

    const where: any = {};

    if (category) where.category = category;
    if (key) where.configKey = Like(`%${key}%`);
    if (is_public !== undefined) where.isPublic = is_public === 'true';

    const [list, total] = await this.configRepository.findAndCount({
      where,
      order: { category: 'ASC', sort: 'ASC' },
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
    const config = await this.configRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('配置不存在');
    }
    return config;
  }

  async findByKey(configKey: string) {
    const config = await this.configRepository.findOne({ where: { configKey } });
    if (!config) {
      throw new NotFoundException('配置不存在');
    }
    return {
      key: config.configKey,
      value: config.configValue,
      type: config.type,
    };
  }

  async findPublicConfigs() {
    const configs = await this.configRepository.find({
      where: { isPublic: true },
      order: { category: 'ASC', sort: 'ASC' },
    });

    const result: Record<string, any> = {};
    configs.forEach((config) => {
      let value: any = config.configValue;
      if (config.type === 'number') {
        value = Number(config.configValue);
      } else if (config.type === 'boolean') {
        value = config.configValue === 'true';
      } else if (config.type === 'json') {
        try {
          value = JSON.parse(config.configValue);
        } catch {
          value = config.configValue;
        }
      }
      result[config.configKey] = value;
    });

    return result;
  }

  async findCategories() {
    const result = await this.configRepository
      .createQueryBuilder('config')
      .select('config.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('config.category')
      .getRawMany();

    return result;
  }

  async create(createDto: CreateConfigDto, operatorId: number) {
    const existing = await this.configRepository.findOne({
      where: { configKey: createDto.key },
    });
    if (existing) {
      throw new BadRequestException('配置键已存在');
    }

    // 验证 JSON 类型
    if (createDto.type === 'json') {
      try {
        JSON.parse(createDto.value);
      } catch {
        throw new BadRequestException('JSON 格式不正确');
      }
    }

    const config = this.configRepository.create({
      category: createDto.category,
      configKey: createDto.key,
      configValue: createDto.value,
      description: createDto.description,
      type: createDto.type || 'string',
      isPublic: createDto.is_public || false,
      sort: createDto.sort || 0,
    });

    const saved = await this.configRepository.save(config);

    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'config',
      action: 'create',
      method: 'POST',
      url: '/api/configs',
      params: JSON.stringify(createDto),
      status: 'success',
    });

    return saved;
  }

  async update(id: number, updateDto: UpdateConfigDto, operatorId: number) {
    const config = await this.configRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('配置不存在');
    }

    // 验证 JSON 类型
    if (updateDto.value && updateDto.type === 'json') {
      try {
        JSON.parse(updateDto.value);
      } catch {
        throw new BadRequestException('JSON 格式不正确');
      }
    }

    if (updateDto.value !== undefined) {
      config.configValue = updateDto.value;
    }
    if (updateDto.description !== undefined) {
      config.description = updateDto.description;
    }
    if (updateDto.type !== undefined) {
      config.type = updateDto.type;
    }
    if (updateDto.is_public !== undefined) {
      config.isPublic = updateDto.is_public;
    }
    if (updateDto.sort !== undefined) {
      config.sort = updateDto.sort;
    }

    const updated = await this.configRepository.save(config);

    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'config',
      action: 'update',
      method: 'PUT',
      url: `/api/configs/${id}`,
      params: JSON.stringify(updateDto),
      status: 'success',
    });

    return updated;
  }

  async batchUpdate(configs: { key: string; value: string }[], operatorId: number) {
    for (const item of configs) {
      const config = await this.configRepository.findOne({ where: { configKey: item.key } });
      if (!config) {
        throw new NotFoundException(`配置键 ${item.key} 不存在`);
      }
      config.configValue = item.value;
      await this.configRepository.save(config);
    }

    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'config',
      action: 'batch_update',
      method: 'PUT',
      url: '/api/configs/batch',
      params: JSON.stringify({ configs }),
      status: 'success',
    });

    return { message: '批量更新成功' };
  }

  async remove(id: number, operatorId: number) {
    const config = await this.configRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('配置不存在');
    }

    await this.configRepository.remove(config);

    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'config',
      action: 'delete',
      method: 'DELETE',
      url: `/api/configs/${id}`,
      params: JSON.stringify({ id }),
      status: 'success',
    });

    return { message: '删除成功' };
  }
}
