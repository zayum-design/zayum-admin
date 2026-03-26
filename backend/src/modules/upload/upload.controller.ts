import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadService } from './upload.service';
import { QueryUploadDto } from './dto/query-upload.dto';
import type { Request } from 'express';

@Controller('api/admin')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx)$/)) {
          cb(new Error('不允许的文件类型'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category: string = 'attachment',
    @Req() req: Request,
  ) {
    const user = (req as any).user || { id: 0, userType: 'admin' };
    const upload = await this.uploadService.create(file, category, user.id, user.userType || 'admin');
    return {
      code: 200,
      message: '上传成功',
      data: {
        id: upload.id,
        filename: upload.filename,
        filepath: upload.filepath,
        url: upload.url,
        filesize: upload.filesize,
        mimetype: upload.mimetype,
        extension: upload.fileExt,
        category: upload.category,
      },
    };
  }

  @Get('uploads')
  async findAll(@Query() query: QueryUploadDto) {
    return this.uploadService.findAll(query);
  }

  @Get('uploads/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.uploadService.findOne(id);
  }

  @Delete('uploads/:id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.uploadService.remove(id);
  }

  @Delete('uploads/batch')
  async batchRemove(@Body('ids') ids: number[]) {
    return this.uploadService.batchRemove(ids);
  }
}
