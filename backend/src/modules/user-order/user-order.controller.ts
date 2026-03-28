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
import { SysUserOrderService } from './user-order.service';
import { CreateSysUserOrderDto } from './dto/create-user-order.dto';
import { UpdateSysUserOrderDto } from './dto/update-user-order.dto';
import { QuerySysUserOrderDto } from './dto/query-user-order.dto';

@Controller('api/admin/user/order')
export class SysUserOrderController {
  constructor(private readonly userOrderService: SysUserOrderService) {}

  @Get()
  async findAll(@Query() query: QuerySysUserOrderDto) {
    return this.userOrderService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userOrderService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateSysUserOrderDto) {
    return this.userOrderService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSysUserOrderDto,
  ) {
    return this.userOrderService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.userOrderService.remove(id);
  }
}