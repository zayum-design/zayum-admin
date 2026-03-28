import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { SysAdminPermission } from '../../entities/sys-admin-permission.entity';
import { CreateAdminPermissionDto } from './dto/create-admin-permission.dto';
import { UpdateAdminPermissionDto } from './dto/update-admin-permission.dto';

@Injectable()
export class AdminPermissionService {
  constructor(
    @InjectRepository(SysAdminPermission)
    private permissionRepository: Repository<SysAdminPermission>,
  ) {}

  async findAll(status?: string, type?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    return this.permissionRepository.find({ where, order: { sort: 'ASC', id: 'ASC' } });
  }

  async findTree(status?: string, type?: string) {
    const permissions = await this.findAll(status, type);
    return this.buildTree(permissions);
  }

  private buildTree(permissions: SysAdminPermission[]): any[] {
    const map = new Map<number, any>();
    const roots: any[] = [];

    // 第一步：创建所有节点的映射
    permissions.forEach((p) => {
      map.set(p.id, { ...p, children: [] });
    });

    // 第二步：构建树形结构
    permissions.forEach((p) => {
      const node = map.get(p.id);
      // 安全地处理 parentId，可能是数字、字符串或 null/undefined
      const parentId = p.parentId ? Number(p.parentId) : 0;
      
      if (parentId === 0) {
        // 根节点
        roots.push(node);
      } else {
        const parent = map.get(parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          // 如果父节点不存在，也作为根节点处理
          roots.push(node);
        }
      }
    });

    // 第三步：按 sort 字段排序
    const sortNodes = (nodes: any[]) => {
      return nodes.sort((a, b) => {
        if (a.sort !== b.sort) {
          return a.sort - b.sort;
        }
        return a.id - b.id;
      });
    };

    // 递归排序所有子节点
    const sortTree = (nodes: any[]) => {
      const sorted = sortNodes(nodes);
      sorted.forEach(node => {
        if (node.children && node.children.length > 0) {
          node.children = sortTree(node.children);
        }
      });
      return sorted;
    };

    return sortTree(roots);
  }

  async findOne(id: number) {
    const permission = await this.permissionRepository.findOne({ where: { id } });
    if (!permission) {
      throw new NotFoundException('权限不存在');
    }
    return permission;
  }

  async create(createPermissionDto: CreateAdminPermissionDto) {
    // 检查 code 是否唯一
    const existing = await this.permissionRepository.findOne({
      where: { code: createPermissionDto.code },
    });
    if (existing) {
      throw new BadRequestException('权限代码已存在');
    }

    const permission = this.permissionRepository.create({
      ...createPermissionDto,
      parentId: createPermissionDto.parent_id || 0,
    });
    return this.permissionRepository.save(permission);
  }

  async update(id: number, updatePermissionDto: UpdateAdminPermissionDto) {
    const permission = await this.findOne(id);

    // 检查是否尝试将自己的子权限作为父权限
    if (updatePermissionDto.parent_id) {
      const isCircular = await this.checkCircularReference(id, updatePermissionDto.parent_id);
      if (isCircular) {
        throw new BadRequestException('不能将父权限设置为自己或自己的子权限');
      }
    }

    Object.assign(permission, updatePermissionDto);
    return this.permissionRepository.save(permission);
  }

  private async checkCircularReference(id: number, parentId: number): Promise<boolean> {
    if (id === parentId) return true;

    const children = await this.permissionRepository.find({ where: { parentId: id } });
    for (const child of children) {
      if (child.id === parentId) return true;
      if (await this.checkCircularReference(child.id, parentId)) return true;
    }
    return false;
  }

  async remove(id: number) {
    const permission = await this.findOne(id);

    // 检查是否有子权限
    const children = await this.permissionRepository.find({ where: { parentId: id } });
    if (children.length > 0) {
      throw new BadRequestException('存在子权限，不允许删除');
    }

    await this.permissionRepository.remove(permission);
    return { message: '删除成功' };
  }

  async findByIds(ids: number[]) {
    if (!ids || ids.length === 0) return [];
    return this.permissionRepository.find({
      where: {
        id: In(ids),
      },
    });
  }

  async findAllMenu() {
    return this.permissionRepository.find({
      where: { type: 'menu', status: 'normal' },
      order: { sort: 'ASC', id: 'ASC' },
    });
  }
}
