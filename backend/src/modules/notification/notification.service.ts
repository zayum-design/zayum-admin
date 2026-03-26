import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { SysNotification } from '../../entities/sys-notification.entity';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { EmailService } from './email.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(SysNotification)
    private notificationRepository: Repository<SysNotification>,
    private emailService: EmailService,
  ) {}

  async findAll(query: QueryNotificationDto, userId?: number, userType?: string) {
    const { page = 1, pageSize = 10, userType: queryUserType, userId: queryUserId, type, isRead, createdAtStart, createdAtEnd } = query;

    const where: any = {};

    // 非管理员只能查看自己的通知
    if (userType !== 'admin' || userId) {
      where.userId = userId;
      where.userType = userType || 'user';
    } else if (queryUserType) {
      where.userType = queryUserType;
    }

    if (queryUserId) {
      where.userId = parseInt(queryUserId, 10);
    }

    if (type) {
      where.type = type;
    }

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    if (createdAtStart) {
      where.createdAt = MoreThanOrEqual(new Date(createdAtStart));
    }

    if (createdAtEnd) {
      where.createdAt = LessThanOrEqual(new Date(createdAtEnd));
    }

    const [list, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 获取未读数量
    const unreadCount = await this.notificationRepository.count({
      where: {
        ...where,
        isRead: false,
      },
    });

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      unreadCount,
    };
  }

  async findOne(id: number, userId?: number, userType?: string) {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    // 非管理员只能查看自己的通知
    if (userType !== 'admin' && notification.userId !== userId) {
      throw new ForbiddenException('无权查看此通知');
    }

    return notification;
  }

  async getUnreadCount(userId: number, userType: string) {
    const count = await this.notificationRepository.count({
      where: {
        userId,
        userType,
        isRead: false,
      },
    });
    return { unreadCount: count };
  }

  async getLatest(userId: number, userType: string, limit: number = 5) {
    const list = await this.notificationRepository.find({
      where: { userId, userType },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return list;
  }

  async create(dto: CreateNotificationDto) {
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      userType: dto.userType || 'user',
      type: dto.type || 'system',
      title: dto.title,
      content: dto.content,
      link: dto.link,
    });
    return this.notificationRepository.save(notification);
  }

  async batchCreate(userIds: number[], userType: 'admin' | 'user', title: string, content: string, link?: string, type: 'system' | 'message' = 'system') {
    const notifications = userIds.map((userId) =>
      this.notificationRepository.create({
        userId,
        userType,
        type,
        title,
        content,
        link,
      }),
    );
    return this.notificationRepository.save(notifications);
  }

  async markAsRead(id: number, userId: number, userType: string) {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    // 非管理员只能标记自己的通知
    if (userType !== 'admin' && notification.userId !== userId) {
      throw new ForbiddenException('无权操作此通知');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);
    }

    return notification;
  }

  async batchMarkAsRead(ids?: number[], userId?: number, userType?: string) {
    if (ids && ids.length > 0) {
      await this.notificationRepository.update(
        { id: In(ids), userId, userType },
        { isRead: true, readAt: new Date() },
      );
    } else if (userId && userType) {
      await this.notificationRepository.update(
        { userId, userType, isRead: false },
        { isRead: true, readAt: new Date() },
      );
    }
    return { message: '标记已读成功' };
  }

  async remove(id: number, userId: number, userType: string) {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    // 非管理员只能删除自己的通知
    if (userType !== 'admin' && notification.userId !== userId) {
      throw new ForbiddenException('无权删除此通知');
    }

    await this.notificationRepository.remove(notification);
    return { message: '删除成功' };
  }

  async batchRemove(ids: number[], userId: number, userType: string) {
    // 非管理员只能删除自己的通知
    if (userType !== 'admin') {
      await this.notificationRepository.delete({ id: In(ids), userId, userType });
    } else {
      await this.notificationRepository.delete({ id: In(ids) });
    }
    return { message: '批量删除成功' };
  }

  async sendEmail(dto: SendEmailDto) {
    if (!this.emailService.isConfigured()) {
      throw new Error('邮件服务未配置');
    }
    await this.emailService.sendEmail(dto.to, dto.subject, dto.content);
    return { message: '邮件发送成功' };
  }

  async testEmail(to: string) {
    await this.emailService.testEmail(to);
    return { message: '测试邮件发送成功' };
  }
}
