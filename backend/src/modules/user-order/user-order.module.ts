import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysUserOrderService } from './user-order.service';
import { SysUserOrderController } from './user-order.controller';
import { SysUserOrder } from '../../entities/sys-user-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysUserOrder])],
  controllers: [SysUserOrderController],
  providers: [SysUserOrderService],
})
export class SysUserOrderModule {}