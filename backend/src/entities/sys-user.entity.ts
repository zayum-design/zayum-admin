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
import { SysUserGroup } from './sys-user-group.entity';

@Entity('sys_user')
@Index('idx_username', ['username'], { unique: true })
@Index('idx_email', ['email'], { unique: true })
@Index('idx_mobile', ['mobile'], { unique: true })
@Index('idx_group_id', ['groupId'])
@Index('idx_status', ['status'])
export class SysUser {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
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

  @Column({ type: 'varchar', length: 20, default: 'unknown', name: 'gender' })
  gender: string;

  @Column({ type: 'date', nullable: true })
  birthday: Date;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  status: string;

  @Column({ type: 'int', default: 0, name: 'score' })
  score: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'balance' })
  balance: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => SysUserGroup)
  @JoinColumn({ name: 'group_id' })
  group: SysUserGroup;
}
