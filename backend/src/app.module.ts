import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RolePermissionModule } from './modules/role-permission/role-permission.module';
import { AdminModule } from './modules/admin/admin.module';
import { AdminGroupModule } from './modules/admin-group/admin-group.module';
import { UserModule } from './modules/user/user.module';
import { UserGroupModule } from './modules/user-group/user-group.module';
import { LogModule } from './modules/log/log.module';
import { ConfigModule } from './modules/config/config.module';
import { UploadModule } from './modules/upload/upload.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AiModule } from './modules/ai/ai.module';
import { MemberModule } from './modules/member/member.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [NestConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST') || 'localhost',
        port: parseInt(configService.get('DB_PORT') || '5432', 10),
        username: configService.get('DB_USERNAME') || 'niujinhui',
        password: configService.get('DB_PASSWORD') || '',
        database: configService.get('DB_DATABASE') || 'system_admin',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    // 限流配置：100个请求在60秒内
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    AuthModule,
    PermissionModule,
    RolePermissionModule,
    AdminModule,
    AdminGroupModule,
    UserModule,
    UserGroupModule,
    LogModule,
    ConfigModule,
    UploadModule,
    NotificationModule,
    ProfileModule,
    AiModule,
    MemberModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
