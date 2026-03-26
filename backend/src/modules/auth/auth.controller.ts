import { Controller, Post, Get, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SysAdmin } from '../../entities/sys-admin.entity';

@Controller('api/admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ip = req.ip || (req.socket?.remoteAddress) || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Post('logout')
  async logout(@CurrentUser() admin: SysAdmin) {
    return this.authService.logout(admin);
  }

  @Get('profile')
  getProfile(@CurrentUser() admin: SysAdmin) {
    return this.authService.getProfile(admin);
  }

  @Get('permissions')
  getPermissions(@CurrentUser() admin: SysAdmin) {
    return this.authService.getPermissions(admin);
  }

  @Get('menus')
  getMenus(@CurrentUser() admin: SysAdmin) {
    return this.authService.getMenus(admin);
  }
}
