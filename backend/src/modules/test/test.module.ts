import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysTestService } from './test.service';
import { SysTestController } from './test.controller';
import { SysTest } from '../../entities/sys-test.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysTest])],
  controllers: [SysTestController],
  providers: [SysTestService],
})
export class SysTestModule {}