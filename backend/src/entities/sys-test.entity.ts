import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sys_test')
export class SysTest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  keu: string;

  @Column({ type: 'varchar' })
  stadsaf: string;

  @Column({ type: 'date' })
  fasd: Date;

  @Column({ type: 'timestamp' })
  afds: Date;
}