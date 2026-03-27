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
import { SysTestService } from './test.service';
import { CreateSysTestDto } from './dto/create-test.dto';
import { UpdateSysTestDto } from './dto/update-test.dto';
import { QuerySysTestDto } from './dto/query-test.dto';

@Controller('api/admin/test')
export class SysTestController {
  constructor(private readonly testService: SysTestService) {}

  @Get()
  async findAll(@Query() query: QuerySysTestDto) {
    return this.testService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.testService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateSysTestDto) {
    return this.testService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSysTestDto,
  ) {
    return this.testService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.testService.remove(id);
  }
}