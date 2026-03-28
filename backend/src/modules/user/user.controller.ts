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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { QueryUserDto } from './dto/query-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SysAdmin } from '../../entities/sys-admin.entity';

@ApiTags('用户管理')
@ApiBearerAuth('JWT-auth')
@Controller('api/admin/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表', description: '分页查询用户列表' })
  @ApiResponse({ status: 200, description: '成功返回用户列表' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  async findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情', description: '根据ID获取用户详细信息' })
  @ApiParam({ name: 'id', description: '用户ID', type: Number })
  @ApiResponse({ status: 200, description: '成功返回用户详情' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建用户', description: '创建新用户' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '用户名或邮箱已存在' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() admin: SysAdmin,
  ) {
    return this.userService.create(createUserDto, admin.id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户', description: '更新用户信息' })
  @ApiParam({ name: 'id', description: '用户ID', type: Number })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: '用户更新成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
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
