import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { QueryUserDto } from './dto/query-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SysAdmin } from '../../entities/sys-admin.entity';

@Controller('api/admin/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.userService.create(createUserDto, admin.id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.userService.update(id, updateUserDto, admin.id);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.userService.remove(id, admin.id);
  }

  @Delete('batch')
  async batchRemove(
    @Body('ids') ids: number[],
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.userService.batchRemove(ids, admin.id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.userService.updateStatus(id, status, admin.id);
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('new_password') newPassword: string,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.userService.resetPassword(id, newPassword, admin.id);
  }

  @Patch(':id/score')
  async updateScore(
    @Param('id', ParseIntPipe) id: number,
    @Body('score') score: number,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.userService.updateScore(id, score, admin.id);
  }

  @Patch(':id/balance')
  async updateBalance(
    @Param('id', ParseIntPipe) id: number,
    @Body('balance') balance: number,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.userService.updateBalance(id, balance, admin.id);
  }

  @Patch(':id/adjust-score')
  async adjustScore(
    @Param('id', ParseIntPipe) id: number,
    @Body('delta') delta: number,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.userService.adjustScore(id, delta, admin.id);
  }

  @Patch(':id/adjust-balance')
  async adjustBalance(
    @Param('id', ParseIntPipe) id: number,
    @Body('delta') delta: number,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.userService.adjustBalance(id, delta, admin.id);
  }
}
