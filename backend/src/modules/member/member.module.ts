import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { SysUser } from '../../entities/sys-user.entity';
import { SmsCode } from '../../entities/sms-code.entity';
import { SysUserBalanceEntity } from '../../entities/sys-user-balance.entity';
import { SysUserScoreEntity } from '../../entities/sys-user-score.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysUser, SmsCode, SysUserBalanceEntity, SysUserScoreEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-super-secret-key-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
