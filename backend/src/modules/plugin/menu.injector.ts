import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysPluginMenu } from '../../entities/sys-plugin-menu.entity';
import { SysAdminPermission } from '../../entities/sys-admin-permission.entity';
import { MenuConfig } from './interfaces';

@Injectable()
export class MenuInjector {
  constructor(
    @InjectRepository(SysPluginMenu)
    private pluginMenuRepo: Repository<SysPluginMenu>,
    @InjectRepository(SysAdminPermission)
    private permissionRepo: Repository<SysAdminPermission>,
  ) {}

  async injectMenus(pluginId: number, menus: MenuConfig[]): Promise<void> {
    for (const menu of menus) {
      // 创建插件菜单记录
      const pluginMenu = this.pluginMenuRepo.create({
        pluginId,
        menuKey: menu.key,
        menuName: menu.name,
        path: menu.path,
        component: menu.component,
        icon: menu.icon,
        parentId: menu.parentKey ? await this.findParentId(menu.parentKey) : undefined,
        orderNum: menu.order || 0,
        permission: menu.permission,
      });
      await this.pluginMenuRepo.save(pluginMenu);

      // 如果有权限标识，创建权限记录
      if (menu.permission) {
        await this.createPermission(menu);
      }
    }
  }

  async removeMenus(pluginId: number): Promise<void> {
    // 获取该插件的所有菜单
    const menus = await this.pluginMenuRepo.find({ where: { pluginId } });
    
    // 删除相关权限
    for (const menu of menus) {
      if (menu.permission) {
        await this.permissionRepo.delete({ code: menu.permission });
      }
    }
    
    // 删除菜单记录
    await this.pluginMenuRepo.delete({ pluginId });
  }

  private async findParentId(parentKey: string): Promise<number | undefined> {
    // 查找父菜单ID
    const menu = await this.pluginMenuRepo.findOne({
      where: { menuKey: parentKey },
    });
    return menu?.id || undefined;
  }

  private async createPermission(menu: MenuConfig): Promise<void> {
    const exists = await this.permissionRepo.findOne({
      where: { code: menu.permission },
    });
    
    if (!exists) {
      const permission = this.permissionRepo.create({
        code: menu.permission,
        name: menu.name,
        description: `插件菜单权限: ${menu.name}`,
      });
      await this.permissionRepo.save(permission);
    }
  }

  async getPluginMenus(pluginId: number): Promise<SysPluginMenu[]> {
    return this.pluginMenuRepo.find({
      where: { pluginId },
      order: { orderNum: 'ASC' },
    });
  }
}
