import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRolePermissionController } from './admin-role-permission.controller';
import { AdminRolePermissionService } from './admin-role-permission.service';
import { SysAdminRolePermission } from '../../entities/sys-admin-role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysAdminRolePermission])],
  controllers: [AdminRolePermissionController],
  providers: [AdminRolePermissionService],
  exports: [AdminRolePermissionService],
})
export class AdminRolePermissionModule {}