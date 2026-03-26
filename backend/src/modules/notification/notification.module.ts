import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { SysNotification } from '../../entities/sys-notification.entity';
import { SysConfig } from '../../entities/sys-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysNotification, SysConfig]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, EmailService],
  exports: [NotificationService, EmailService],
})
export class NotificationModule {}
