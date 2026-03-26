import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sys_permission')
@Index('idx_code', ['code'], { unique: true })
@Index('idx_parent_id', ['parentId'])
@Index('idx_status', ['status'])
export class SysPermission {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', default: 0, name: 'parent_id' })
  parentId: number;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 20, default: 'menu' })
  type: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  path: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  component: string;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
