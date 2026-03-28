import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SysPlugin } from './sys-plugin.entity';

@Entity('sys_plugin_menu')
export class SysPluginMenu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pluginId: number;

  @ManyToOne(() => SysPlugin, (plugin) => plugin.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pluginId' })
  plugin: SysPlugin;

  @Column({ length: 64 })
  menuKey: string;  // 菜单唯一标识

  @Column({ length: 128 })
  menuName: string;  // 菜单名称

  @Column({ length: 255, nullable: true })
  path: string;  // 路由路径

  @Column({ length: 128, nullable: true })
  component: string;  // 组件路径

  @Column({ length: 64, nullable: true })
  icon: string;  // 图标名称

  @Column({ nullable: true })
  parentId: number;  // 父菜单ID

  @Column({ type: 'int', default: 0 })
  orderNum: number;  // 排序号

  @Column({ length: 128, nullable: true })
  permission: string;  // 权限标识

  @Column({ type: 'json', nullable: true })
  meta: Record<string, any>;  // 额外元数据

  @CreateDateColumn()
  createdAt: Date;
}
