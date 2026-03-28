import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysUserPermissionService } from './user-permission.service';
import { SysUserPermissionController } from './user-permission.controller';
import { SysUserPermission } from '../../entities/sys-user-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysUserPermission])],
  controllers: [SysUserPermissionController],
  providers: [SysUserPermissionService],
})
export class SysUserPermissionModule {}