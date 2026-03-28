import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 用户组权限关联表
 * 用于关联用户组和权限，类似 sys_role_permission
 */
@Entity('sys_user_role_permission')
export class SysUserRolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', name: 'user_group_id' })
  userGroupId: number;

  @Column({ type: 'bigint', name: 'permission_id' })
  permissionId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
