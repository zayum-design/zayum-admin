import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SysAdminGroup } from './sys-admin-group.entity';

@Entity('sys_admin')
export class SysAdmin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', default: 1, name: 'group_id' })
  groupId: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 50 })
  nickname: string;

  @Column({ type: 'varchar', length: 128 })
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 11, nullable: true })
  mobile: string;

  @Column({ type: 'int', default: 0, name: 'login_failure' })
  loginFailure: number;

  @Column({ type: 'timestamp', nullable: true, name: 'login_at' })
  loginAt: Date;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'login_ip' })
  loginIp: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  token: string;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => SysAdminGroup)
  @JoinColumn({ name: 'group_id' })
  group: SysAdminGroup;
}
