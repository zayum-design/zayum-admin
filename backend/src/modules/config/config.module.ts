import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';
import { SysConfig } from '../../entities/sys-config.entity';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysConfig, SysOperationLog])],
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
