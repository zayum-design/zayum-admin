import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogController } from './log.controller';
import { LogService } from './log.service';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';
import { SysLoginLog } from '../../entities/sys-login-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysOperationLog, SysLoginLog])],
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}
