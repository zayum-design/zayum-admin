import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminPermissionController } from './admin-permission.controller';
import { AdminPermissionService } from './admin-permission.service';
import { SysAdminPermission } from '../../entities/sys-admin-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysAdminPermission])],
  controllers: [AdminPermissionController],
  providers: [AdminPermissionService],
  exports: [AdminPermissionService],
})
export class AdminPermissionModule {}
