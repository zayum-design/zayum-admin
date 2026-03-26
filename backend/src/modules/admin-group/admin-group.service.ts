import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { SysAdminGroup } from '../../entities/sys-admin-group.entity';
import { SysAdmin } from '../../entities/sys-admin.entity';
import { SysRolePermission } from '../../entities/sys-role-permission.entity';
import { SysPermission } from '../../entities/sys-permission.entity';
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
    @InjectRepository(SysRolePermission)
    private rolePermissionRepository: Repository<SysRolePermission>,
    @InjectRepository(SysPermission)
    private permissionRepository: Repository<SysPermission>,
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

    // 获取该组的权限
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId: id, roleType: 'admin' },
    });

    const permissionIds = rolePermissions.map((rp) => rp.permissionId);

    let permissions: SysPermission[] = [];
    if (permissionIds.length > 0) {
      permissions = await this.permissionRepository.findBy({
        id: permissionIds as any,
      });
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
      await queryRunner.manager.delete(SysRolePermission, {
        roleId: id,
        userType: 'admin',
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

    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId: id, roleType: 'admin' },
    });

    const permissionIds = rolePermissions.map((rp) => rp.permissionId);

    let permissions: SysPermission[] = [];
    if (permissionIds.length > 0) {
      permissions = await this.permissionRepository.findBy({
        id: permissionIds as any,
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

    // 验证所有权限ID是否存在
    if (permissionIds.length > 0) {
      const existingPermissions = await this.permissionRepository.findBy({
        id: permissionIds as any,
      });
      if (existingPermissions.length !== permissionIds.length) {
        throw new BadRequestException('部分权限ID不存在');
      }
    }

    // 使用事务处理
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 删除原有的权限关联
      await queryRunner.manager.delete(SysRolePermission, {
        roleId: id,
        roleType: 'admin',
      });

      // 批量插入新的权限关联
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((permissionId) => {
          const rp = new SysRolePermission();
          rp.roleId = id;
          rp.permissionId = permissionId;
          rp.roleType = 'admin';
          return rp;
        });
        await queryRunner.manager.save(rolePermissions);
      }

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
