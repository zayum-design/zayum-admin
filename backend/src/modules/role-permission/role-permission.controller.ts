import { Controller, Get, Post, Body, Query, ParseIntPipe } from '@nestjs/common';
import { RolePermissionService } from './role-permission.service';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@Controller('api/admin/role-permissions')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Get()
  async getRolePermissions(
    @Query('role_type') roleType: string,
    @Query('role_id', ParseIntPipe) roleId: number,
  ) {
    return this.rolePermissionService.getRolePermissions(roleType, roleId);
  }

  @Post()
  async assignPermissions(@Body() dto: AssignPermissionsDto) {
    return this.rolePermissionService.assignPermissions(dto);
  }

  @Get('group')
  async getGroupPermissions(
    @Query('group_id', ParseIntPipe) groupId: number,
    @Query('group_type') groupType: 'admin_group' | 'user_group',
  ) {
    return this.rolePermissionService.getGroupPermissions(groupId, groupType);
  }
}
