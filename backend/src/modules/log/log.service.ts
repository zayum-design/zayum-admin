import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';
import { SysLoginLog } from '../../entities/sys-login-log.entity';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { QueryLoginLogDto } from './dto/query-login-log.dto';

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(SysOperationLog)
    private operationLogRepository: Repository<SysOperationLog>,
    @InjectRepository(SysLoginLog)
    private loginLogRepository: Repository<SysLoginLog>,
  ) {}

  // 操作日志
  async findAllOperations(query: QueryOperationLogDto) {
    const {
      page = 1,
      pageSize = 10,
      user_type,
      user_id,
      username,
      module,
      action,
      method,
      status,
      ip,
    } = query;

    const where: FindOptionsWhere<SysOperationLog> = {};

    if (user_type) where.userType = user_type;
    if (user_id) where.userId = user_id;
    if (username) where.username = Like(`%${username}%`);
    if (module) where.module = Like(`%${module}%`);
    if (action) where.action = Like(`%${action}%`);
    if (method) where.method = method;
    if (status) where.status = status;
    if (ip) where.ip = Like(`%${ip}%`);

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

  async findOneOperation(id: number) {
    const log = await this.operationLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException('操作日志不存在');
    }
    return log;
  }

  async getOperationStatistics(start_date?: string, end_date?: string, dimension?: string) {
    const where: any = {};
    if (start_date) where.createdAt = Like(`%${start_date}%`);

    const logs = await this.operationLogRepository.find({ where });

    // 按日期统计
    const byDate: Record<string, number> = {};
    logs.forEach((log) => {
      const date = new Date(log.createdAt).toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;
    });

    // 按模块统计
    const byModule: Record<string, number> = {};
    logs.forEach((log) => {
      byModule[log.module] = (byModule[log.module] || 0) + 1;
    });

    // 按状态统计
    const byStatus: Record<string, number> = {};
    logs.forEach((log) => {
      byStatus[log.status] = (byStatus[log.status] || 0) + 1;
    });

    return {
      by_date: Object.entries(byDate).map(([date, count]) => ({ date, count })),
      by_module: Object.entries(byModule).map(([module, count]) => ({ module, count })),
      by_status: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
    };
  }

  // 登录日志
  async findAllLogins(query: QueryLoginLogDto) {
    const {
      page = 1,
      pageSize = 10,
      user_type,
      user_id,
      username,
      ip,
      location,
      status,
    } = query;

    const where: FindOptionsWhere<SysLoginLog> = {};

    if (user_type) where.userType = user_type;
    if (user_id) where.userId = user_id;
    if (username) where.username = Like(`%${username}%`);
    if (ip) where.ip = Like(`%${ip}%`);
    if (location) where.location = Like(`%${location}%`);
    if (status) where.status = status;

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

  async findOneLogin(id: number) {
    const log = await this.loginLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException('登录日志不存在');
    }
    return log;
  }

  async getLoginStatistics(start_date?: string, end_date?: string, dimension?: string) {
    const where: any = {};
    if (start_date) where.createdAt = Like(`%${start_date}%`);

    const logs = await this.loginLogRepository.find({ where });

    // 按日期统计
    const byDate: Record<string, number> = {};
    logs.forEach((log) => {
      const date = new Date(log.createdAt).toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;
    });

    // 按状态统计
    const byStatus: Record<string, number> = {};
    logs.forEach((log) => {
      byStatus[log.status] = (byStatus[log.status] || 0) + 1;
    });

    // 按地点统计
    const byLocation: Record<string, number> = {};
    logs.forEach((log) => {
      if (log.location) {
        byLocation[log.location] = (byLocation[log.location] || 0) + 1;
      }
    });

    return {
      by_date: Object.entries(byDate).map(([date, count]) => ({ date, count })),
      by_status: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      by_location: Object.entries(byLocation)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([location, count]) => ({ location, count })),
    };
  }
}
