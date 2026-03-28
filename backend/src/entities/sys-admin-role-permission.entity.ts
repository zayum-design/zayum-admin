import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('sys_admin_role_permission')
export class SysAdminRolePermission {
  @PrimaryGeneratedColumn()
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
