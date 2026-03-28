import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sys_user_order')
export class SysUserOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', nullable: false })
  user_id: number;

  @Column({ type: 'varchar', nullable: false })
  order_no: string;

  @Column({ type: 'varchar', nullable: false })
  order_type: string;

  @Column({ type: 'decimal', nullable: false })
  amount: number;

  @Column({ type: 'decimal', nullable: true })
  pay_amount: number;

  @Column({ type: 'varchar', nullable: true })
  currency: string;

  @Column({ type: 'varchar', nullable: false })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  pay_method: string;

  @Column({ type: 'varchar', nullable: true })
  pay_trade_no: string;

  @Column({ type: 'text', nullable: true })
  pay_data: string;

  @Column({ type: 'text', nullable: true })
  snapshot: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  remark: string;

  @Column({ type: 'jsonb', nullable: true })
  extra_data: object;

  @Column({ type: 'varchar', nullable: true })
  ip: string;

  @Column({ type: 'varchar', nullable: true })
  user_agent: string;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expired_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}