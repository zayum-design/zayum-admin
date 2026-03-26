import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('sys_operation_log')
@Index('idx_user_type', ['userType'])
@Index('idx_user_id', ['userId'])
@Index('idx_created_at', ['createdAt'])
@Index('idx_status', ['status'])
export class SysOperationLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 20, name: 'user_type' })
  userType: string;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Column({ type: 'varchar', length: 50 })
  module: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'text', nullable: true })
  params: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'user_agent' })
  userAgent: string;

  @Column({ type: 'varchar', length: 20, default: 'success' })
  status: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'error_msg' })
  errorMsg: string;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
