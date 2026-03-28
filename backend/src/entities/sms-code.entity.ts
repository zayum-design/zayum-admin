import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('sms_code')
export class SmsCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 11, name: 'mobile' })
  mobile: string;

  @Column({ type: 'varchar', length: 6, name: 'code' })
  code: string;

  @Column({ type: 'varchar', length: 20, name: 'type' })
  type: string; // register, login, reset

  @Column({ type: 'timestamp', name: 'expired_at' })
  expiredAt: Date;

  @Column({ type: 'boolean', default: false, name: 'used' })
  used: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
