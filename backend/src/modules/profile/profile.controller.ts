import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { Request } from 'express';

@Controller('api/admin/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() req: Request) {
    const user = (req as any).user || { id: 0, userType: 'admin' };
    return this.profileService.getProfile(user.id, user.userType);
  }

  @Put()
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user || { id: 0, userType: 'admin' };
    return this.profileService.updateProfile(user.id, user.userType, dto);
  }

  @Post('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user || { id: 0, userType: 'admin' };
    return this.profileService.changePassword(user.id, user.userType, dto);
  }

  @Get('login-logs')
  async getLoginLogs(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Req() req: Request,
  ) {
    const user = (req as any).user || { id: 0, userType: 'admin' };
    return this.profileService.getLoginLogs(user.id, user.userType, page, pageSize);
  }

  @Get('operation-logs')
  async getOperationLogs(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Req() req: Request,
  ) {
    const user = (req as any).user || { id: 0, userType: 'admin' };
    return this.profileService.getOperationLogs(user.id, user.userType, page, pageSize);
  }
}
