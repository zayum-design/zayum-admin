import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGroupController } from './user-group.controller';
import { UserGroupService } from './user-group.service';
import { SysUserGroup } from '../../entities/sys-user-group.entity';
import { SysUser } from '../../entities/sys-user.entity';
import { SysUserRolePermission } from '../../entities/sys-user-role-permission.entity';
import { SysUserPermission } from '../../entities/sys-user-permission.entity';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SysUserGroup,
      SysUser,
      SysUserRolePermission,
      SysUserPermission,
      SysOperationLog,
    ]),
  ],
  controllers: [UserGroupController],
  providers: [UserGroupService],
  exports: [UserGroupService],
})
export class UserGroupModule {}
