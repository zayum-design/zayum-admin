import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource, In } from 'typeorm';
import { SysAdminGroup } from '../../entities/sys-admin-group.entity';
import { SysAdmin } from '../../entities/sys-admin.entity';
import { SysAdminRolePermission } from '../../entities/sys-admin-role-permission.entity';
import { SysAdminPermission } from '../../entities/sys-admin-permission.entity';
import { SysOperationLog } from '../../entities/sys-operation-log.entity';
import { QueryAdminGroupDto } from './dto/query-admin-group.dto';
import { CreateAdminGroupDto } from './dto/create-admin-group.dto';
import { UpdateAdminGroupDto } from './dto/update-admin-group.dto';

@Injectable()
export class AdminGroupService {
  constructor(
    @InjectRepository(SysAdminGroup)
    private adminGroupRepository: Repository<SysAdminGroup>,
    @InjectRepository(SysAdmin)
    private adminRepository: Repository<SysAdmin>,
    @InjectRepository(SysAdminRolePermission)
    private rolePermissionRepository: Repository<SysAdminRolePermission>,
    @InjectRepository(SysAdminPermission)
    private permissionRepository: Repository<SysAdminPermission>,
    @InjectRepository(SysOperationLog)
    private operationLogRepository: Repository<SysOperationLog>,
    private dataSource: DataSource,
  ) {}

  async findAll(query: QueryAdminGroupDto) {
    const { page = 1, pageSize = 10, name, status } = query;

    const where: any = {};
    if (name) where.name = Like(`%${name}%`);
    if (status) where.status = status;

    const [list, total] = await this.adminGroupRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 统计每个组的管理员数量
    const result = await Promise.all(
      list.map(async (group) => {
        const adminCount = await this.adminRepository.count({
          where: { groupId: group.id },
        });
        return {
          ...group,
          admin_count: adminCount,
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
    const group = await this.adminGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('管理员组不存在');
    }

    const adminCount = await this.adminRepository.count({
      where: { groupId: id },
    });

    // 检查permissions字段，优先使用该字段的值
    let permissionIds: number[] = [];
    let permissions: SysAdminPermission[] = [];
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
        const rolePermissions = await this.rolePermissionRepository.find({
          where: { roleId: id, roleType: 'admin' },
        });
        permissionIds = rolePermissions.map((rp) => rp.permissionId);
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
      const rolePermissions = await this.rolePermissionRepository.find({
        where: { roleId: id, roleType: 'admin' },
      });
      permissionIds = rolePermissions.map((rp) => rp.permissionId);
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
      admin_count: adminCount,
      permissions: permissions.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
      })),
    };
  }

  async create(createDto: CreateAdminGroupDto, operatorId: number) {
    // 检查组名唯一性
    const existing = await this.adminGroupRepository.findOne({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new BadRequestException('组名已存在');
    }

    const group = this.adminGroupRepository.create(createDto);
    const savedGroup = await this.adminGroupRepository.save(group);

    // 记录操作日志
    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'admin-group',
      action: 'create',
      method: 'POST',
      url: '/api/admin-groups',
      params: JSON.stringify(createDto),
      status: 'success',
    });

    return savedGroup;
  }

  async update(id: number, updateDto: UpdateAdminGroupDto, operatorId: number) {
    const group = await this.adminGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('管理员组不存在');
    }

    // 不允许修改超级管理员组
    if (id === 1) {
      delete updateDto.name;
      delete updateDto.status;
    }

    // 检查新组名唯一性
    if (updateDto.name && updateDto.name !== group.name) {
      const existing = await this.adminGroupRepository.findOne({
        where: { name: updateDto.name },
      });
      if (existing) {
        throw new BadRequestException('组名已存在');
      }
    }

    Object.assign(group, updateDto);
    const updatedGroup = await this.adminGroupRepository.save(group);

    // 记录操作日志
    await this.operationLogRepository.save({
      userType: 'admin',
      userId: operatorId,
      username: 'system',
      module: 'admin-group',
      action: 'update',
      method: 'PUT',
      url: `/api/admin-groups/${id}`,
      params: JSON.stringify(updateDto),
      status: 'success',
    });

    return updatedGroup;
  }

  async remove(id: number, operatorId: number) {
    if (id === 1) {
      throw new BadRequestException('不能删除超级管理员组');
    }

    const group = await this.adminGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('管理员组不存在');
    }

    // 检查该组是否有管理员
    const adminCount = await this.adminRepository.count({
      where: { groupId: id },
    });
    if (adminCount > 0) {
      throw new BadRequestException('该组下还有管理员，请先移除或转移管理员');
    }

    // 使用事务删除权限关联
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 删除权限关联
      await queryRunner.manager.delete(SysAdminRolePermission, {
        roleId: id,
        roleType: 'admin',
      });

      // 删除管理员组
      await queryRunner.manager.remove(group);

      await queryRunner.commitTransaction();

      // 记录操作日志
      await this.operationLogRepository.save({
        userType: 'admin',
        userId: operatorId,
        username: 'system',
        module: 'admin-group',
        action: 'delete',
        method: 'DELETE',
        url: `/api/admin-groups/${id}`,
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
    const group = await this.adminGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('管理员组不存在');
    }

    // 检查permissions字段，优先使用该字段的值
    let permissionIds: number[] = [];
    try {
      if (group.permissions) {
        const permsJson = JSON.parse(group.permissions);
        if (Array.isArray(permsJson)) {
          if (permsJson.includes('*')) {
            // 拥有所有权限，返回所有权限ID
            const allPermissions = await this.permissionRepository.find({
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
        const rolePermissions = await this.rolePermissionRepository.find({
          where: { roleId: id, roleType: 'admin' },
        });
        permissionIds = rolePermissions.map((rp) => rp.permissionId);
      }
    } catch (error) {
      console.error('解析permissions字段失败:', error);
      // 如果解析失败，回退到从关联表查询
      const rolePermissions = await this.rolePermissionRepository.find({
        where: { roleId: id, roleType: 'admin' },
      });
      permissionIds = rolePermissions.map((rp) => rp.permissionId);
    }

    let permissions: SysAdminPermission[] = [];
    if (permissionIds.length > 0) {
      permissions = await this.permissionRepository.find({
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
    const group = await this.adminGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('管理员组不存在');
    }

    // 不允许修改超级管理员组的权限
    if (id === 1) {
      throw new BadRequestException('不能修改超级管理员组的权限');
    }

    // 获取所有有效的权限ID
    const allPermissions = await this.permissionRepository.find({
      where: { status: 'normal' },
      select: ['id'],
    });
    const allPermissionIds = allPermissions.map(p => p.id);

    // 检查是否选择了所有权限（即所有权限ID都包含在内）
    const isAllPermissions = allPermissionIds.length > 0 &&
                            permissionIds.length === allPermissionIds.length &&
                            permissionIds.every(id => allPermissionIds.includes(id)) &&
                            allPermissionIds.every(id => permissionIds.includes(id));

    // 过滤掉不存在的权限ID
    let validPermissionIds: number[] = [];
    if (permissionIds.length > 0) {
      const existingPermissions = await this.permissionRepository.find({
        where: {
          id: In(permissionIds),
        },
      });
      validPermissionIds = existingPermissions.map(p => p.id);

      // 如果有不存在的权限ID，记录日志但不抛出异常
      if (validPermissionIds.length !== permissionIds.length) {
        const missingIds = permissionIds.filter(id => !validPermissionIds.includes(id));
        console.warn(`部分权限ID不存在，将被忽略: ${missingIds.join(', ')}`);
      }
    }

    // 使用事务处理
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 删除原有的权限关联
      await queryRunner.manager.delete(SysAdminRolePermission, {
        roleId: id,
        roleType: 'admin',
      });

      // 如果拥有所有权限，permissions字段存储["*"]，不在关联表中存储所有记录
      if (isAllPermissions) {
        // 权限字段存储["*"]表示拥有所有权限
        group.permissions = JSON.stringify(['*']);
      } else if (validPermissionIds.length > 0) {
        // 在关联表中创建新记录
        const rolePermissions = validPermissionIds.map((permissionId) => {
          const rp = new SysAdminRolePermission();
          rp.roleId = id;
          rp.permissionId = permissionId;
          rp.roleType = 'admin';
          return rp;
        });
        await queryRunner.manager.save(rolePermissions);

        // 更新管理员组表的permissions字段（存储JSON格式的权限ID数组）
        group.permissions = JSON.stringify(validPermissionIds);
      } else {
        // 没有选择任何权限
        group.permissions = JSON.stringify([]);
      }

      // 保存管理员组（更新permissions字段）
      await queryRunner.manager.save(group);

      await queryRunner.commitTransaction();

      // 记录操作日志
      await this.operationLogRepository.save({
        userType: 'admin',
        userId: operatorId,
        username: 'system',
        module: 'admin-group',
        action: 'assign_permissions',
        method: 'POST',
        url: `/api/admin-groups/${id}/permissions`,
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

  async getGroupAdmins(id: number, page = 1, pageSize = 10) {
    const group = await this.adminGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('管理员组不存在');
    }

    const [list, total] = await this.adminRepository.findAndCount({
      where: { groupId: id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const result = list.map((admin) => {
      const { password, token, loginFailure, ...rest } = admin;
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
