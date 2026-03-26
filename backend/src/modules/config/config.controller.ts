import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ConfigService } from './config.service';
import { QueryConfigDto } from './dto/query-config.dto';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { BatchUpdateConfigDto } from './dto/batch-update-config.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SysAdmin } from '../../entities/sys-admin.entity';

@Controller('api/admin/configs')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  async findAll(@Query() query: QueryConfigDto) {
    return this.configService.findAll(query);
  }

  @Get('categories')
  async findCategories() {
    return this.configService.findCategories();
  }

  @Get('public')
  async findPublicConfigs() {
    return this.configService.findPublicConfigs();
  }

  @Get('by-key/:key')
  async findByKey(@Param('key') key: string) {
    return this.configService.findByKey(key);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.configService.findOne(id);
  }

  @Post()
  async create(
    @Body() createDto: CreateConfigDto,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.configService.create(createDto, admin.id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateConfigDto,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.configService.update(id, updateDto, admin.id);
  }

  @Put('batch')
  async batchUpdate(
    @Body() batchDto: BatchUpdateConfigDto,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.configService.batchUpdate(batchDto.configs, admin.id);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.configService.remove(id, admin.id);
  }
}
