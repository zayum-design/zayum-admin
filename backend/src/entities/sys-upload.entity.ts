import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('sys_upload')
@Index('idx_user_type', ['userType'])
@Index('idx_user_id', ['userId'])
@Index('idx_category', ['category'])
@Index('idx_created_at', ['createdAt'])
export class SysUpload {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 20, name: 'user_type' })
  userType: string;

  @Column({ type: 'bigint', nullable: true, name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'varchar', length: 200, name: 'filename' })
  filename: string;

  @Column({ type: 'varchar', length: 500, name: 'filepath' })
  filepath: string;

  @Column({ type: 'bigint', name: 'filesize' })
  filesize: number;

  @Column({ type: 'varchar', length: 100, name: 'mimetype' })
  mimetype: string;

  @Column({ type: 'varchar', length: 10, name: 'file_ext' })
  fileExt: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
