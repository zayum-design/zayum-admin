import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { PermissionsGuard } from './guards/permissions.guard';
import { SysAdmin } from '../../entities/sys-admin.entity';
import { SysLoginLog } from '../../entities/sys-login-log.entity';
import { SysRolePermission } from '../../entities/sys-role-permission.entity';
import { SysPermission } from '../../entities/sys-permission.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'default-secret',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '2h',
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([SysAdmin, SysLoginLog, SysRolePermission, SysPermission]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, PermissionsGuard],
  exports: [AuthService, PermissionsGuard],
})
export class AuthModule {}
