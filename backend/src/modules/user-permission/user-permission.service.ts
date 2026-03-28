import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { SysUserPermission } from '../../entities/sys-user-permission.entity';
import { CreateSysUserPermissionDto } from './dto/create-user-permission.dto';
import { UpdateSysUserPermissionDto } from './dto/update-user-permission.dto';
import { QuerySysUserPermissionDto } from './dto/query-user-permission.dto';

@Injectable()
export class SysUserPermissionService {
  constructor(
    @InjectRepository(SysUserPermission)
    private userPermissionRepository: Repository<SysUserPermission>,
  ) {}

  async findAll(query: QuerySysUserPermissionDto) {
    const { page = 1, pageSize = 10 } = query;
    
    const where: any = {};
    
    // TODO: 添加查询条件
    
    const [list, total] = await this.userPermissionRepository.findAndCount({
      where,
      order: { id: 'DESC' },
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

  async findTree(status?: string, type?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    
    const permissions = await this.userPermissionRepository.find({
      where,
      order: { sort: 'ASC', id: 'ASC' },
    });
    
    return this.buildTree(permissions);
  }

  private buildTree(permissions: SysUserPermission[]): any[] {
    console.log('buildTree called with permissions:', permissions.length);
    const map = new Map<number, any>();
    const roots: any[] = [];

    permissions.forEach((p) => {
      console.log(`Permission id=${p.id}, parent_id=${p.parent_id}, type=${typeof p.parent_id}, name=${p.name}`);
      // 创建纯对象，包含所有属性
      map.set(p.id, {
        ...p,
        children: [], // 初始化为空数组
      });
    });

    permissions.forEach((p) => {
      const node = map.get(p.id);
      // 确保 parent_id 是数字类型
      const parentId = typeof p.parent_id === 'string' ? parseInt(p.parent_id, 10) : p.parent_id;
      console.log(`Processing id=${p.id}, parent_id=${p.parent_id}, parsed parentId=${parentId}, map.has(${parentId})=${map.has(parentId)}`);
      if (parentId === 0 || !map.has(parentId)) {
        roots.push(node);
        console.log(`  -> Added to roots (parentId=${parentId})`);
      } else {
        const parent = map.get(parentId);
        if (parent) {
          parent.children.push(node);
          console.log(`  -> Added as child of ${parentId} (${parent.name})`);
        }
      }
    });

    console.log(`Total roots: ${roots.length}`);
    roots.forEach(root => {
      console.log(`Root id=${root.id}, name=${root.name}, children=${root.children.length}`);
    });

    // 对根节点按 sort 排序
    roots.sort((a, b) => {
      if (a.sort !== b.sort) {
        return (a.sort || 0) - (b.sort || 0);
      }
      return a.id - b.id;
    });

    // 对每个节点的子节点也排序
    const sortChildren = (node: any) => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a: any, b: any) => {
          if (a.sort !== b.sort) {
            return (a.sort || 0) - (b.sort || 0);
          }
          return a.id - b.id;
        });
        node.children.forEach(sortChildren);
      }
    };

    roots.forEach(sortChildren);

    return roots;
  }

  async findOne(id: number) {
    const item = await this.userPermissionRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('记录不存在');
    }
    return item;
  }

  async create(createDto: CreateSysUserPermissionDto) {
    // 检查 code 是否唯一
    const existing = await this.userPermissionRepository.findOne({
      where: { code: createDto.code },
    });
    if (existing) {
      throw new BadRequestException('权限代码已存在');
    }

    const item = this.userPermissionRepository.create(createDto);
    return this.userPermissionRepository.save(item);
  }

  async update(id: number, updateDto: UpdateSysUserPermissionDto) {
    const item = await this.findOne(id);

    // 检查是否尝试将自己的子权限作为父权限
    if (updateDto.parent_id) {
      const isCircular = await this.checkCircularReference(id, updateDto.parent_id);
      if (isCircular) {
        throw new BadRequestException('不能将父权限设置为自己或自己的子权限');
      }
    }

    Object.assign(item, updateDto);
    return this.userPermissionRepository.save(item);
  }

  private async checkCircularReference(id: number, parentId: number): Promise<boolean> {
    if (id === parentId) return true;

    const children = await this.userPermissionRepository.find({ where: { parent_id: id } });
    for (const child of children) {
      if (child.id === parentId) return true;
      if (await this.checkCircularReference(child.id, parentId)) return true;
    }
    return false;
  }

  async remove(id: number) {
    const item = await this.findOne(id);

    // 检查是否有子权限
    const children = await this.userPermissionRepository.find({ where: { parent_id: id } });
    if (children.length > 0) {
      throw new BadRequestException('存在子权限，不允许删除');
    }

    await this.userPermissionRepository.remove(item);
    return { message: '删除成功' };
  }

  async findByIds(ids: number[]) {
    if (!ids || ids.length === 0) return [];
    return this.userPermissionRepository.find({
      where: {
        id: In(ids),
      },
    });
  }
}
