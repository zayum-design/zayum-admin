import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermissionController } from './role-permission.controller';
import { RolePermissionService } from './role-permission.service';
import { SysRolePermission } from '../../entities/sys-role-permission.entity';
import { SysPermission } from '../../entities/sys-permission.entity';
import { SysAdminGroup } from '../../entities/sys-admin-group.entity';
import { SysUserGroup } from '../../entities/sys-user-group.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SysRolePermission,
      SysPermission,
      SysAdminGroup,
      SysUserGroup,
    ]),
  ],
  controllers: [RolePermissionController],
  providers: [RolePermissionService],
  exports: [RolePermissionService],
})
export class RolePermissionModule {}
