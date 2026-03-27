import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { UserBalanceService } from './user-balance.service';
import { CreateUserBalanceDto } from './dto/create-user-balance.dto';
import { UpdateUserBalanceDto } from './dto/update-user-balance.dto';
import { QueryUserBalanceDto } from './dto/query-user-balance.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/admin/user-balance')
@UseGuards(AuthGuard('jwt'))
export class UserBalanceController {
  constructor(private readonly userBalanceService: UserBalanceService) {}

  @Post()
  create(@Body() createUserBalanceDto: CreateUserBalanceDto) {
    return this.userBalanceService.create(createUserBalanceDto);
  }

  @Get()
  findAll(@Query() queryUserBalanceDto: QueryUserBalanceDto) {
    return this.userBalanceService.findAll(queryUserBalanceDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userBalanceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserBalanceDto: UpdateUserBalanceDto) {
    return this.userBalanceService.update(+id, updateUserBalanceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userBalanceService.remove(+id);
  }
}
