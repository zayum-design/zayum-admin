import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { SysUpload } from '../../entities/sys-upload.entity';
import { QueryUploadDto } from './dto/query-upload.dto';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(SysUpload)
    private uploadRepository: Repository<SysUpload>,
  ) {}

  async findAll(query: QueryUploadDto) {
    const { page = 1, pageSize = 10, user_type, user_id, category, extension, filename } = query;

    const where: any = {};

    if (user_type) where.userType = user_type;
    if (user_id) where.userId = user_id;
    if (category) where.category = category;
    if (extension) where.extension = extension;
    if (filename) where.filename = Like(`%${filename}%`);

    const [list, total] = await this.uploadRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const upload = await this.uploadRepository.findOne({ where: { id } });
    if (!upload) {
      throw new NotFoundException('文件不存在');
    }
    return upload;
  }

  async create(file: Express.Multer.File, category: string, userId: number, userType: string) {
    // 生成日期路径
    const now = new Date();
    const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

    // 文件名保持原始名称
    const filename = file.originalname;
    const filepath = `/uploads/${category}/${datePath}/${filename}`;

    const upload = this.uploadRepository.create({
      userId,
      userType,
      category,
      filename: file.originalname,
      filepath,
      url: filepath,
      filesize: file.size,
      mimetype: file.mimetype,
      fileExt: path.extname(file.originalname).toLowerCase().replace('.', ''),
    });

    return this.uploadRepository.save(upload);
  }

  async remove(id: number) {
    const upload = await this.uploadRepository.findOne({ where: { id } });
    if (!upload) {
      throw new NotFoundException('文件不存在');
    }

    // 删除磁盘文件
    const fullPath = path.join(process.cwd(), upload.filepath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await this.uploadRepository.remove(upload);
    return { message: '删除成功' };
  }

  async batchRemove(ids: number[]) {
    const uploads = await this.uploadRepository.find({
      where: {
        id: In(ids),
      },
    });
    for (const upload of uploads) {
      const fullPath = path.join(process.cwd(), upload.filepath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
    await this.uploadRepository.remove(uploads);
    return { message: '批量删除成功' };
  }
}
