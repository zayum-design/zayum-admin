import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { SysUserGroup } from '../../entities/sys-user-group.entity';
import { SysUser } from '../../entities/sys-user.entity';
import { SysRolePermission } from '../../entities/sys-role-permission.entity';
import { SysPermission } from '../../entities/sys-permission.entity';
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
    @InjectRepository(SysRolePermission)
    private rolePermissionRepository: Repository<SysRolePermission>,
    @InjectRepository(SysPermission)
    private permissionRepository: Repository<SysPermission>,
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

    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId: id, roleType: 'user_group' },
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
      await queryRunner.manager.delete(SysRolePermission, {
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

    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId: id, roleType: 'user_group' },
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
    const group = await this.userGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('用户组不存在');
    }

    if (permissionIds.length > 0) {
      const existingPermissions = await this.permissionRepository.findBy({
        id: permissionIds as any,
      });
      if (existingPermissions.length !== permissionIds.length) {
        throw new BadRequestException('部分权限ID不存在');
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(SysRolePermission, {
        roleId: id,
        roleType: 'user_group',
      });

      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((permissionId) => {
          const rp = new SysRolePermission();
          rp.roleId = id;
          rp.permissionId = permissionId;
          rp.roleType = 'user_group';
          return rp;
        });
        await queryRunner.manager.save(rolePermissions);
      }

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
