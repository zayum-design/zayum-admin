import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/admin/permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

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
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.remove(id);
  }
}
