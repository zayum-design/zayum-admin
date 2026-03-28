import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sys_plugin')
export class SysPlugin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 64 })
  name: string;  // 插件标识名，如 "schedule"

  @Column({ length: 128 })
  displayName: string;  // 显示名称

  @Column({ length: 32 })
  version: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'installed',
  })
  status: string;

  @Column({ type: 'json', nullable: true })
  config: Record<string, any>;  // 插件配置

  @Column({ type: 'json', nullable: true })
  manifest: Record<string, any>;  // plugin.json 完整内容

  @Column({ type: 'text', nullable: true })
  errorMessage: string;  // 错误信息（当 status=error 时）

  @Column({ default: false })
  hasMigrations: boolean;  // 是否有数据库迁移

  @Column({ type: 'timestamp', nullable: true })
  lastActivatedAt: Date;  // 最后启用时间

  @CreateDateColumn()
  installedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
