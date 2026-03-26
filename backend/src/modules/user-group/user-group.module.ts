import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGroupController } from './user-group.controller';
import { UserGroupService } from './user-group.service';
import { SysUserGroup } from '../../entities/sys-user-group.entity';
import { SysUser } from '../../entities/sys-user.entity';
import { SysRolePermission } from '../../entities/sys-role-permission.entity';
import { SysPermission } from '../../entities/sys-permission.entity';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SysUserGroup,
      SysUser,
      SysRolePermission,
      SysPermission,
      SysOperationLog,
    ]),
  ],
  controllers: [UserGroupController],
  providers: [UserGroupService],
  exports: [UserGroupService],
})
export class UserGroupModule {}
