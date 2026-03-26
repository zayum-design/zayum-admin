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
import { AdminGroupService } from './admin-group.service';
import { QueryAdminGroupDto } from './dto/query-admin-group.dto';
import { CreateAdminGroupDto } from './dto/create-admin-group.dto';
import { UpdateAdminGroupDto } from './dto/update-admin-group.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SysAdmin } from '../../entities/sys-admin.entity';

@Controller('api/admin/admin-groups')
export class AdminGroupController {
  constructor(private readonly adminGroupService: AdminGroupService) {}

  @Get()
  async findAll(@Query() query: QueryAdminGroupDto) {
    return this.adminGroupService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminGroupService.findOne(id);
  }

  @Post()
  async create(
    @Body() createDto: CreateAdminGroupDto,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.adminGroupService.create(createDto, admin.id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAdminGroupDto,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.adminGroupService.update(id, updateDto, admin.id);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.adminGroupService.remove(id, admin.id);
  }

  @Get(':id/permissions')
  async getPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.adminGroupService.getPermissions(id);
  }

  @Post(':id/permissions')
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignDto: AssignPermissionsDto,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.adminGroupService.assignPermissions(id, assignDto.permission_ids, admin.id);
  }

  @Get(':id/admins')
  async getGroupAdmins(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.adminGroupService.getGroupAdmins(id, page || 1, pageSize || 10);
  }
}
