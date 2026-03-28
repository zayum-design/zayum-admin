import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminGroupController } from './admin-group.controller';
import { AdminGroupService } from './admin-group.service';
import { SysAdminGroup } from '../../entities/sys-admin-group.entity';
import { SysAdmin } from '../../entities/sys-admin.entity';
import { SysAdminRolePermission } from '../../entities/sys-admin-role-permission.entity';
import { SysAdminPermission } from '../../entities/sys-admin-permission.entity';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SysAdminGroup,
      SysAdmin,
      SysAdminRolePermission,
      SysAdminPermission,
      SysOperationLog,
    ]),
  ],
  controllers: [AdminGroupController],
  providers: [AdminGroupService],
  exports: [AdminGroupService],
})
export class AdminGroupModule {}
