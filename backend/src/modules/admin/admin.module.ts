import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { SysAdmin } from '../../entities/sys-admin.entity';
import { SysAdminGroup } from '../../entities/sys-admin-group.entity';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysAdmin, SysAdminGroup, SysOperationLog]), AuthModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
