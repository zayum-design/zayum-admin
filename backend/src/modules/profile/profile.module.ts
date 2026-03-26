import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { SysAdmin } from '../../entities/sys-admin.entity';
import { SysUser } from '../../entities/sys-user.entity';
import { SysAdminGroup } from '../../entities/sys-admin-group.entity';
import { SysUserGroup } from '../../entities/sys-user-group.entity';
import { SysLoginLog } from '../../entities/sys-login-log.entity';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SysAdmin,
      SysUser,
      SysAdminGroup,
      SysUserGroup,
      SysLoginLog,
      SysOperationLog,
    ]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
