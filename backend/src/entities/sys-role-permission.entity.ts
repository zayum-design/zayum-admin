import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('sys_role_permission')
@Index('idx_role_permission', ['roleType', 'roleId', 'permissionId'], { unique: true })
export class SysRolePermission {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 20, name: 'role_type' })
  roleType: string;

  @Column({ type: 'bigint', name: 'role_id' })
  roleId: number;

  @Column({ type: 'bigint', name: 'permission_id' })
  permissionId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
