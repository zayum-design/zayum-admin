import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { CodeGeneratorService } from './code-generator.service';
import { GetTablesDto } from './dto/get-tables.dto';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { DownloadCodeDto } from './dto/download-code.dto';
import { CreateMenuDto } from './dto/create-menu.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { CheckTableDto } from './dto/check-table.dto';

@Controller('api/admin/code-generator')
export class CodeGeneratorController {
  constructor(private readonly codeGeneratorService: CodeGeneratorService) {}

  @Get('tables')
  async getTables(@Query() query: GetTablesDto): Promise<any> {
    const tables = await this.codeGeneratorService.getTables(query);
    return {
      code: 200,
      message: '获取成功',
      data: tables,
    };
  }

  @Get('columns/:tableName')
  async getColumns(@Param('tableName') tableName: string): Promise<any> {
    const columns = await this.codeGeneratorService.getColumns(tableName);
    return {
      code: 200,
      message: '获取成功',
      data: columns,
    };
  }

  @Post('generate')
  async generateCode(@Body() dto: GenerateCodeDto): Promise<any> {
    const files = await this.codeGeneratorService.generateCode(dto);
    return {
      code: 200,
      message: '生成成功',
      data: files,
    };
  }

  @Post('download')
  async downloadCode(@Body() dto: DownloadCodeDto): Promise<any> {
    console.log('[CodeGeneratorController] downloadCode dto:', dto);
    const result = await this.codeGeneratorService.downloadCode(dto);
    return {
      code: 200,
      message: '下载成功',
      data: result,
    };
  }

  @Post('create-menu')
  async createMenu(@Body() dto: CreateMenuDto): Promise<any> {
    const result = await this.codeGeneratorService.createMenu(dto);
    return {
      code: 200,
      message: '菜单创建成功',
      data: result,
    };
  }

  @Get('check-table')
  async checkTableExists(@Query() query: CheckTableDto): Promise<any> {
    const exists = await this.codeGeneratorService.checkTableExists(query.tableName);
    return {
      code: 200,
      message: '查询成功',
      data: { exists },
    };
  }

  @Post('create-table')
  async createTable(@Body() dto: CreateTableDto): Promise<any> {
    const result = await this.codeGeneratorService.createTable(dto);
    return {
      code: 200,
      message: '表创建成功',
      data: result,
    };
  }
}
