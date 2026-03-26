import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { SendEmailDto } from './dto/send-email.dto';
import type { Request } from 'express';

@Controller('api/admin/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async findAll(@Query() query: QueryNotificationDto, @Req() req: Request) {
    const user = (req as any).user || { id: 0, userType: 'admin' };
    return this.notificationService.findAll(query, user.id, user.userType);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: Request) {
    const user = (req as any).user || { id: 0, userType: 'admin' };
    return this.notificationService.getUnreadCount(user.id, user.userType);
  }

  @Get('latest')
  async getLatest(@Query('limit') limit: number = 5, @Req() req: Request) {
    const user = (req as any).user || { id: 0, userType: 'admin' };
    return this.notificationService.getLatest(user.id, user.userType, limit);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = (req as any).user || { id: 0, userType: 'admin' };
    return this.notificationService.findOne(id, user.id, user.userType);
  }

  @Post()
  async create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Post('batch')
  async batchCreate(
    @Body('userIds') userIds: number[],
    @Body('userType') userType: 'admin' | 'user',
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('link') link?: string,
    @Body('type') type?: 'system' | 'message',
  ) {
    return this.notificationService.batchCreate(userIds, userType, title, content, link, type);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = (req as any).user || { id: 0, userType: 'admin' };
    return this.notificationService.markAsRead(id, user.id, user.userType);
  }

  @Post('mark-read')
  async batchMarkAsRead(@Body('ids') ids: number[] | undefined, @Req() req: Request) {
    const user = (req as any).user || { id: 0, userType: 'admin' };
    return this.notificationService.batchMarkAsRead(ids, user.id, user.userType);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = (req as any).user || { id: 0, userType: 'admin' };
    return this.notificationService.remove(id, user.id, user.userType);
  }

  @Delete('batch')
  async batchRemove(@Body('ids') ids: number[], @Req() req: Request) {
    const user = (req as any).user || { id: 0, userType: 'admin' };
    return this.notificationService.batchRemove(ids, user.id, user.userType);
  }

  @Post('send-email')
  async sendEmail(@Body() dto: SendEmailDto) {
    return this.notificationService.sendEmail(dto);
  }

  @Post('test-email')
  async testEmail(@Body('to') to: string) {
    return this.notificationService.testEmail(to);
  }
}
