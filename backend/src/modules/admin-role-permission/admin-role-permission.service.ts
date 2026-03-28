import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { SysAdminRolePermission } from '../../entities/sys-admin-role-permission.entity';
import { CreateAdminRolePermissionDto } from './dto/create-admin-role-permission.dto';
import { UpdateAdminRolePermissionDto } from './dto/update-admin-role-permission.dto';
import { QueryAdminRolePermissionDto } from './dto/query-admin-role-permission.dto';

@Injectable()
export class AdminRolePermissionService {
  constructor(
    @InjectRepository(SysAdminRolePermission)
    private rolePermissionRepository: Repository<SysAdminRolePermission>,
  ) {}

  async findAll(query: QueryAdminRolePermissionDto) {
    const { page = 1, pageSize = 10, roleType, roleId, permissionId } = query;

    const where: FindOptionsWhere<SysAdminRolePermission> = {};

    if (roleType) where.roleType = roleType;
    if (roleId) where.roleId = roleId;
    if (permissionId) where.permissionId = permissionId;

    const [list, total] = await this.rolePermissionRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: { id },
    });

    if (!rolePermission) {
      throw new NotFoundException('角色权限关系不存在');
    }

    return rolePermission;
  }

  async create(createRolePermissionDto: CreateAdminRolePermissionDto) {
    // 检查唯一性约束
    const existing = await this.rolePermissionRepository.findOne({
      where: {
        roleType: createRolePermissionDto.roleType,
        roleId: createRolePermissionDto.roleId,
        permissionId: createRolePermissionDto.permissionId,
      },
    });

    if (existing) {
      throw new BadRequestException('该角色权限关系已存在');
    }

    const rolePermission = this.rolePermissionRepository.create(createRolePermissionDto);
    return await this.rolePermissionRepository.save(rolePermission);
  }

  async update(id: number, updateRolePermissionDto: UpdateAdminRolePermissionDto) {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: { id },
    });

    if (!rolePermission) {
      throw new NotFoundException('角色权限关系不存在');
    }

    // 如果修改了角色类型、角色ID或权限ID，需要检查唯一性
    if (
      updateRolePermissionDto.roleType ||
      updateRolePermissionDto.roleId ||
      updateRolePermissionDto.permissionId
    ) {
      const roleType = updateRolePermissionDto.roleType || rolePermission.roleType;
      const roleId = updateRolePermissionDto.roleId || rolePermission.roleId;
      const permissionId = updateRolePermissionDto.permissionId || rolePermission.permissionId;

      const existing = await this.rolePermissionRepository.findOne({
        where: {
          roleType,
          roleId,
          permissionId,
        },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException('该角色权限关系已存在');
      }
    }

    Object.assign(rolePermission, updateRolePermissionDto);
    return await this.rolePermissionRepository.save(rolePermission);
  }

  async remove(id: number) {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: { id },
    });

    if (!rolePermission) {
      throw new NotFoundException('角色权限关系不存在');
    }

    await this.rolePermissionRepository.remove(rolePermission);
    return { message: '删除成功' };
  }
}