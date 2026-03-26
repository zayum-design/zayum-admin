import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminGroupController } from './admin-group.controller';
import { AdminGroupService } from './admin-group.service';
import { SysAdminGroup } from '../../entities/sys-admin-group.entity';
import { SysAdmin } from '../../entities/sys-admin.entity';
import { SysRolePermission } from '../../entities/sys-role-permission.entity';
import { SysPermission } from '../../entities/sys-permission.entity';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SysAdminGroup,
      SysAdmin,
      SysRolePermission,
      SysPermission,
      SysOperationLog,
    ]),
  ],
  controllers: [AdminGroupController],
  providers: [AdminGroupService],
  exports: [AdminGroupService],
})
export class AdminGroupModule {}
