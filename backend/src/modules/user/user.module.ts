import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SysUser } from '../../entities/sys-user.entity';
import { SysUserGroup } from '../../entities/sys-user-group.entity';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';
import { UserScoreModule } from '../user-score/user-score.module';
import { UserBalanceModule } from '../user-balance/user-balance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysUser, SysUserGroup, SysOperationLog]),
    UserScoreModule,
    UserBalanceModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
