import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBalanceService } from './user-balance.service';
import { UserBalanceController } from './user-balance.controller';
import { SysUserBalanceEntity } from '../../entities/sys-user-balance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysUserBalanceEntity])],
  controllers: [UserBalanceController],
  providers: [UserBalanceService],
  exports: [UserBalanceService],
})
export class UserBalanceModule {}
