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
import { SysUserPermissionService } from './user-permission.service';
import { CreateSysUserPermissionDto } from './dto/create-user-permission.dto';
import { UpdateSysUserPermissionDto } from './dto/update-user-permission.dto';
import { QuerySysUserPermissionDto } from './dto/query-user-permission.dto';

@Controller('api/admin/user/permission')
export class SysUserPermissionController {
  constructor(private readonly userPermissionService: SysUserPermissionService) {}

  @Get('tree')
  async getTree(@Query('status') status?: string, @Query('type') type?: string) {
    return this.userPermissionService.findTree(status, type);
  }

  @Get()
  async findAll(@Query() query: QuerySysUserPermissionDto) {
    return this.userPermissionService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userPermissionService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateSysUserPermissionDto) {
    return this.userPermissionService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSysUserPermissionDto,
  ) {
    return this.userPermissionService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.userPermissionService.remove(id);
  }
}
