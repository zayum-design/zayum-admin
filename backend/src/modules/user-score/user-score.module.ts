import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserScoreService } from './user-score.service';
import { UserScoreController } from './user-score.controller';
import { SysUserScoreEntity } from '../../entities/sys-user-score.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysUserScoreEntity])],
  controllers: [UserScoreController],
  providers: [UserScoreService],
  exports: [UserScoreService],
})
export class UserScoreModule {}