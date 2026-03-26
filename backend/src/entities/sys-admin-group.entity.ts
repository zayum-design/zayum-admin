import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { SysAdmin } from './sys-admin.entity';

@Entity('sys_admin_group')
@Index('idx_name', ['name'], { unique: true })
@Index('idx_status', ['status'])
export class SysAdminGroup {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  permissions: string;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SysAdmin, (admin) => admin.group)
  admins: SysAdmin[];
}
