import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { QueryAdminDto } from './dto/query-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SysAdmin } from '../../entities/sys-admin.entity';
import { PermissionsGuard } from '../../modules/auth/guards/permissions.guard';
import { UseGuards } from '@nestjs/common';

@Controller('api/admin/admins')
@UseGuards(PermissionsGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async findAll(@Query() query: QueryAdminDto) {
    return this.adminService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.findOne(id);
  }

  @Post()
  async create(
    @Body() createAdminDto: CreateAdminDto,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.adminService.create(createAdminDto, admin.id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdminDto: UpdateAdminDto,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.adminService.update(id, updateAdminDto, admin.id);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.adminService.remove(id, admin.id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.adminService.updateStatus(id, status, admin.id);
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('new_password') newPassword: string,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.adminService.resetPassword(id, newPassword, admin.id);
  }
}
