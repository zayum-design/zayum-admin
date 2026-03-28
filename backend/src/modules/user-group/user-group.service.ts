import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource, In } from 'typeorm';
import { SysUserGroup } from '../../entities/sys-user-group.entity';
import { SysUser } from '../../entities/sys-user.entity';
import { SysUserRolePermission } from '../../entities/sys-user-role-permission.entity';
import { SysUserPermission } from '../../entities/sys-user-permission.entity';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';
import { QueryUserGroupDto } from './dto/query-user-group.dto';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';

@Injectable()
export class UserGroupService {
  constructor(
    @InjectRepository(SysUserGroup)
    private userGroupRepository: Repository<SysUserGroup>,
    @InjectRepository(SysUser)
    private userRepository: Repository<SysUser>,
    @InjectRepository(SysUserRolePermission)
    private userRolePermissionRepository: Repository<SysUserRolePermission>,
    @InjectRepository(SysUserPermission)
    private permissionRepository: Repository<SysUserPermission>,
    @InjectRepository(SysUserPermission)
    private userPermissionRepository: Repository<SysUserPermission>,
    @InjectRepository(SysOperationLog)
    private operationLogRepository: Repository<SysOperationLog>,
    private dataSource: DataSource,
  ) {}

  async findAll(query: QueryUserGroupDto) {
    const { page = 1, pageSize = 10, name, status } = query;

    const where: any = {};
    if (name) where.name = Like(`%${name}%`);
    if (status) where.status = status;

    const [list, total] = await this.userGroupRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const result = await Promise.all(
      list.map(async (group) => {
        const userCount = await this.userRepository.count({
          where: { groupId: group.id },
        });
        return {
          ...group,
          user_count: userCount,
        };
      }),
    );

    return {
      list: result,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const group = await this.userGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('用户组不存在');
    }

    const userCount = await this.userRepository.count({
      where: { groupId: id },
    });

    // 检查permissions字段，优先使用该字段的值
    let permissionIds: number[] = [];
    let permissions: SysUserPermission[] = [];
    try {
      if (group.permissions) {
        const permsJson = JSON.parse(group.permissions);
        if (Array.isArray(permsJson)) {
          if (permsJson.includes('*')) {
            // 拥有所有权限，返回所有权限
            permissions = await this.permissionRepository.find({
              where: { status: 'normal' },
            });
            permissionIds = permissions.map((p) => p.id);
          } else {
            // 是数字数组，直接使用这些权限ID
            permissionIds = permsJson.filter((id): id is number => 
              typeof id === 'number' && !isNaN(id)
            );
            if (permissionIds.length > 0) {
              permissions = await this.permissionRepository.find({
                where: {
                  id: In(permissionIds),
                },
              });
            }
          }
        }
      }
      
      // 如果permissions字段没有提供有效的权限ID，则从关联表查询
      if (permissionIds.length === 0) {
        const userRolePermissions = await this.userRolePermissionRepository.find({
          where: { userGroupId: id },
        });
        permissionIds = userRolePermissions.map((rp) => rp.permissionId);
        if (permissionIds.length > 0) {
          permissions = await this.permissionRepository.find({
            where: {
              id: In(permissionIds),
            },
          });
        }
      }
    } catch (error) {
      console.error('解析permissions字段失败:', error);
      // 如果解析失败，回退到从关联表查询
      const userRolePermissions = await this.userRolePermissionRepository.find({
        where: { userGroupId: id },
      });
      permissionIds = userRolePermissions.map((rp) => rp.permissionId);
      if (permissionIds.length > 0) {
        permissions = await this.permissionRepository.find({
          where: {
            id: In(permissionIds),
          },
        });
      }
    }

    return {
      ...group,
      user_count: userCount,
      permissions: permissions.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
      })),
    };
  }

  async create(createDto: CreateUserGroupDto, operatorId: number) {
    const existing = await this.userGroupRepository.findOne({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new BadRequestException('组名已存在');
    }

    const group = this.userGroupRepository.create(createDto);
    const savedGroup = await this.userGroupRepository.save(group);

    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'user-group',
      action: 'create',
      method: 'POST',
      url: '/api/user-groups',
      params: JSON.stringify(createDto),
      status: 'success',
    });

    return savedGroup;
  }

  async update(id: number, updateDto: UpdateUserGroupDto, operatorId: number) {
    const group = await this.userGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('用户组不存在');
    }

    if (updateDto.name && updateDto.name !== group.name) {
      const existing = await this.userGroupRepository.findOne({
        where: { name: updateDto.name },
      });
      if (existing) {
        throw new BadRequestException('组名已存在');
      }
    }

    Object.assign(group, updateDto);
    const updatedGroup = await this.userGroupRepository.save(group);

    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'user-group',
      action: 'update',
      method: 'PUT',
      url: `/api/user-groups/${id}`,
      params: JSON.stringify(updateDto),
      status: 'success',
    });

    return updatedGroup;
  }

  async remove(id: number, operatorId: number) {
    if (id === 1) {
      throw new BadRequestException('不能删除默认用户组');
    }

    const group = await this.userGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('用户组不存在');
    }

    const userCount = await this.userRepository.count({
      where: { groupId: id },
    });
    if (userCount > 0) {
      throw new BadRequestException('该组下还有用户，请先移除或转移用户');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 删除sys_user_role_permission表中的记录
      await queryRunner.manager.delete(SysUserRolePermission, {
        userGroupId: id,
      });

      // 删除sys_role_permission表中的记录（保持兼容性）
      await queryRunner.manager.delete(SysUserRolePermission, {
        roleId: id,
        roleType: 'user_group',
      });

      await queryRunner.manager.remove(group);

      await queryRunner.commitTransaction();

      await this.operationLogRepository.save({
        userType: 'admin',
        userId: operatorId,
        username: 'system',
        module: 'user-group',
        action: 'delete',
        method: 'DELETE',
        url: `/api/user-groups/${id}`,
        params: JSON.stringify({ id }),
        status: 'success',
      });

      return { message: '删除成功' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getPermissions(id: number) {
    const group = await this.userGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('用户组不存在');
    }

    // 检查permissions字段，优先使用该字段的值
    let permissionIds: number[] = [];
    try {
      if (group.permissions) {
        const permsJson = JSON.parse(group.permissions);
        if (Array.isArray(permsJson)) {
          if (permsJson.includes('*')) {
            // 拥有所有权限，返回所有用户权限ID
            const allPermissions = await this.userPermissionRepository.find({
              where: { status: 'normal' },
              select: ['id'],
            });
            permissionIds = allPermissions.map((p) => p.id);
          } else {
            // 是数字数组，直接使用
            permissionIds = permsJson.filter((id): id is number => 
              typeof id === 'number' && !isNaN(id)
            );
          }
        }
      }
      
      // 如果permissions字段没有提供有效的权限ID，则从关联表查询
      if (permissionIds.length === 0) {
        const userRolePermissions = await this.userRolePermissionRepository.find({
          where: { userGroupId: id },
        });
        permissionIds = userRolePermissions.map((rp) => rp.permissionId);
      }
    } catch (error) {
      console.error('解析permissions字段失败:', error);
      // 如果解析失败，回退到从关联表查询
      const userRolePermissions = await this.userRolePermissionRepository.find({
        where: { userGroupId: id },
      });
      permissionIds = userRolePermissions.map((rp) => rp.permissionId);
    }

    let permissions: SysUserPermission[] = [];
    if (permissionIds.length > 0) {
      permissions = await this.userPermissionRepository.find({
        where: {
          id: In(permissionIds),
        },
      });
    }

    return {
      permission_ids: permissionIds,
      permissions: permissions.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        type: p.type,
      })),
    };
  }

  async assignPermissions(id: number, permissionIds: number[], operatorId: number) {
    const group = await this.userGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('用户组不存在');
    }

    // 获取所有有效的用户权限ID
    const allPermissions = await this.userPermissionRepository.find({
      where: { status: 'normal' },
      select: ['id'],
    });
    const allPermissionIds = allPermissions.map(p => p.id);
    
    // 检查是否选择了所有权限（即所有权限ID都包含在内）
    const isAllPermissions = allPermissionIds.length > 0 && 
                            permissionIds.length === allPermissionIds.length &&
                            permissionIds.every(id => allPermissionIds.includes(id)) &&
                            allPermissionIds.every(id => permissionIds.includes(id));
    
    // 过滤掉不存在的权限ID - 使用SysUserPermission表（用户权限表）
    let validPermissionIds: number[] = [];
    if (permissionIds.length > 0) {
      const existingPermissions = await this.userPermissionRepository.find({
        where: {
          id: In(permissionIds),
        },
      });
      validPermissionIds = existingPermissions.map(p => p.id);
      
      // 如果有不存在的权限ID，记录日志但不抛出异常
      if (validPermissionIds.length !== permissionIds.length) {
        const missingIds = permissionIds.filter(id => !validPermissionIds.includes(id));
        console.warn(`部分用户权限ID不存在，将被忽略: ${missingIds.join(', ')}`);
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 删除sys_user_role_permission表中的旧记录
      await queryRunner.manager.delete(SysUserRolePermission, {
        userGroupId: id,
      });

      // 删除sys_role_permission表中的旧记录（保持兼容性）
      await queryRunner.manager.delete(SysUserRolePermission, {
        roleId: id,
        roleType: 'user_group',
      });

      // 如果拥有所有权限，permissions字段存储["*"]，不在关联表中存储所有记录
      if (isAllPermissions) {
        // 权限字段存储["*"]表示拥有所有权限
        group.permissions = JSON.stringify(['*']);
      } else if (validPermissionIds.length > 0) {
        // 在sys_user_role_permission表中创建新记录
        const userRolePermissions = validPermissionIds.map((permissionId) => {
          const urp = new SysUserRolePermission();
          urp.userGroupId = id;
          urp.permissionId = permissionId;
          return urp;
        });
        await queryRunner.manager.save(userRolePermissions);

        // 同时在sys_role_permission表中创建记录（保持兼容性）
        const rolePermissions = validPermissionIds.map((permissionId) => {
          const rp = new SysUserRolePermission();
          rp.userGroupId = id;
          rp.permissionId = permissionId;
          return rp;
        });
        await queryRunner.manager.save(rolePermissions);
        
        // 更新用户组表的permissions字段（存储JSON格式的权限ID数组）
        group.permissions = JSON.stringify(validPermissionIds);
      } else {
        // 没有选择任何权限
        group.permissions = JSON.stringify([]);
      }
      
      await queryRunner.manager.save(group);

      await queryRunner.commitTransaction();

      await this.operationLogRepository.save({
        userType: 'admin',
        userId: operatorId,
        username: 'system',
        module: 'user-group',
        action: 'assign_permissions',
        method: 'POST',
        url: `/api/user-groups/${id}/permissions`,
        params: JSON.stringify({ permission_ids: permissionIds }),
        status: 'success',
      });

      return { message: '权限分配成功' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getGroupUsers(id: number, page = 1, pageSize = 10) {
    const group = await this.userGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('用户组不存在');
    }

    const [list, total] = await this.userRepository.findAndCount({
      where: { groupId: id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const result = list.map((user) => {
      const { password, ...rest } = user;
      return rest;
    });

    return {
      list: result,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
