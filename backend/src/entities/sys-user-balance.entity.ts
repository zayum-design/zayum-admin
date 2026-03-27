import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sys_user_balance')
export class SysUserBalanceEntity {
  @PrimaryGeneratedColumn({ comment: 'ID' })
  id: number;

  @Column({ type: 'int', comment: '用户ID' })
  user_id: number;

  @Column({ type: 'int', nullable: true, comment: '管理员ID（操作用户）' })
  admin_id: number;

  @Column({ type: 'varchar', length: 50, comment: '余额场景（如：recharge, consume, refund）' })
  scene: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '变更余额（正数增加，负数减少）' })
  change_balance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '变更前余额' })
  before_balance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '变更后余额' })
  after_balance: number;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '备注说明' })
  remark: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '关联订单号' })
  order_no: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '操作IP地址' })
  ip: string;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;
}
