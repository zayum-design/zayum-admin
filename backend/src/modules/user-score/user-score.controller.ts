import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { UserScoreService } from './user-score.service';
import { CreateUserScoreDto } from './dto/create-user-score.dto';
import { UpdateUserScoreDto } from './dto/update-user-score.dto';
import { QueryUserScoreDto } from './dto/query-user-score.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/admin/user-score')
@UseGuards(AuthGuard('jwt'))
export class UserScoreController {
  constructor(private readonly userScoreService: UserScoreService) {}

  @Post()
  create(@Body() createUserScoreDto: CreateUserScoreDto) {
    return this.userScoreService.create(createUserScoreDto);
  }

  @Get()
  findAll(@Query() queryUserScoreDto: QueryUserScoreDto) {
    return this.userScoreService.findAll(queryUserScoreDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userScoreService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserScoreDto: UpdateUserScoreDto) {
    return this.userScoreService.update(+id, updateUserScoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userScoreService.remove(+id);
  }
}
