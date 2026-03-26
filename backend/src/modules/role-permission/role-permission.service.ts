import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SysRolePermission } from '../../entities/sys-role-permission.entity';
import { SysPermission } from '../../entities/sys-permission.entity';
import { SysAdminGroup } from '../../entities/sys-admin-group.entity';
import { SysUserGroup } from '../../entities/sys-user-group.entity';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectRepository(SysRolePermission)
    private rolePermissionRepository: Repository<SysRolePermission>,
    @InjectRepository(SysPermission)
    private permissionRepository: Repository<SysPermission>,
    @InjectRepository(SysAdminGroup)
    private adminGroupRepository: Repository<SysAdminGroup>,
    @InjectRepository(SysUserGroup)
    private userGroupRepository: Repository<SysUserGroup>,
    private dataSource: DataSource,
  ) {}

  async getRolePermissions(roleType: string, roleId: number) {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleType, roleId },
    });
    return rolePermissions.map((rp) => rp.permissionId);
  }

  async assignPermissions(dto: AssignPermissionsDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 删除该角色的原有权限
      await queryRunner.manager.delete(SysRolePermission, {
        roleType: dto.role_type,
        roleId: dto.role_id,
      });

      // 批量插入新权限
      if (dto.permission_ids.length > 0) {
        const rolePermissions = dto.permission_ids.map((pid) => {
          const rp = new SysRolePermission();
          rp.roleType = dto.role_type;
          rp.roleId = dto.role_id;
          rp.permissionId = pid;
          return rp;
        });
        await queryRunner.manager.save(SysRolePermission, rolePermissions);
      }

      await queryRunner.commitTransaction();
      return { message: '权限分配成功' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getGroupPermissions(groupId: number, groupType: 'admin_group' | 'user_group') {
    const group = groupType === 'admin_group'
      ? await this.adminGroupRepository.findOne({ where: { id: groupId } })
      : await this.userGroupRepository.findOne({ where: { id: groupId } });

    if (!group) return [];

    // 如果是超级管理员组（ID=1），返回所有权限
    if (groupId === 1 && groupType === 'admin_group') {
      return this.permissionRepository.find({
        where: { status: 'normal' },
        order: { sort: 'ASC', id: 'ASC' },
      });
    }

    // 获取组的权限关联
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleType: groupType, roleId: groupId },
    });

    const permissionIds = rolePermissions.map((rp) => rp.permissionId);
    if (permissionIds.length === 0) return [];

    return this.permissionRepository.findByIds(permissionIds);
  }

  async getUserPermissions(userType: 'admin' | 'user', userGroupId: number) {
    const groupType = userType === 'admin' ? 'admin_group' : 'user_group';
    return this.getGroupPermissions(userGroupId, groupType);
  }
}
