import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminRolePermissionService } from './admin-role-permission.service';
import { CreateAdminRolePermissionDto } from './dto/create-admin-role-permission.dto';
import { UpdateAdminRolePermissionDto } from './dto/update-admin-role-permission.dto';
import { QueryAdminRolePermissionDto } from './dto/query-admin-role-permission.dto';

@Controller('api/role-permissions')
export class AdminRolePermissionController {
  constructor(private readonly rolePermissionService: AdminRolePermissionService) {}

  @Get()
  async findAll(@Query() query: QueryAdminRolePermissionDto) {
    return this.rolePermissionService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolePermissionService.findOne(id);
  }

  @Post()
  async create(@Body() createRolePermissionDto: CreateAdminRolePermissionDto) {
    return this.rolePermissionService.create(createRolePermissionDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRolePermissionDto: UpdateAdminRolePermissionDto,
  ) {
    return this.rolePermissionService.update(id, updateRolePermissionDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolePermissionService.remove(id);
  }
}