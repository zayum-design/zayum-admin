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
import { UserGroupService } from './user-group.service';
import { QueryUserGroupDto } from './dto/query-user-group.dto';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SysAdmin } from '../../entities/sys-admin.entity';

@Controller('api/admin/user-groups')
export class UserGroupController {
  constructor(private readonly userGroupService: UserGroupService) {}

  @Get()
  async findAll(@Query() query: QueryUserGroupDto) {
    return this.userGroupService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userGroupService.findOne(id);
  }

  @Post()
  async create(
    @Body() createDto: CreateUserGroupDto,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.userGroupService.create(createDto, admin.id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateUserGroupDto,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.userGroupService.update(id, updateDto, admin.id);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.userGroupService.remove(id, admin.id);
  }

  @Get(':id/permissions')
  async getPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.userGroupService.getPermissions(id);
  }

  @Post(':id/permissions')
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignDto: AssignPermissionsDto,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.userGroupService.assignPermissions(id, assignDto.permission_ids, admin.id);
  }

  @Get(':id/users')
  async getGroupUsers(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.userGroupService.getGroupUsers(id, page || 1, pageSize || 10);
  }
}
