import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { AdminPermissionService } from './admin-permission.service';
import { CreateAdminPermissionDto } from './dto/create-admin-permission.dto';
import { UpdateAdminPermissionDto } from './dto/update-admin-permission.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/admin/permissions')
export class AdminPermissionController {
  constructor(private readonly permissionService: AdminPermissionService) {}

  @Public()
  @Get('tree')
  async getTree(@Query('status') status?: string, @Query('type') type?: string) {
    return this.permissionService.findTree(status, type);
  }

  @Get()
  async getAll(@Query('status') status?: string, @Query('type') type?: string) {
    return this.permissionService.findAll(status, type);
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.findOne(id);
  }

  @Post()
  async create(@Body() createPermissionDto: CreateAdminPermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdateAdminPermissionDto,
  ) {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.remove(id);
  }
}
