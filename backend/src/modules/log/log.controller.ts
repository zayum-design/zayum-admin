import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { LogService } from './log.service';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { QueryLoginLogDto } from './dto/query-login-log.dto';

@Controller('api/admin/logs')
export class LogController {
  constructor(private readonly logService: LogService) {}

  // 操作日志
  @Get('operations')
  async findAllOperations(@Query() query: QueryOperationLogDto) {
    return this.logService.findAllOperations(query);
  }

  @Get('operations/:id')
  async findOneOperation(@Param('id', ParseIntPipe) id: number) {
    return this.logService.findOneOperation(id);
  }

  @Get('operations/statistics')
  async getOperationStatistics(
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('dimension') dimension?: string,
  ) {
    return this.logService.getOperationStatistics(start_date, end_date, dimension);
  }

  // 登录日志
  @Get('logins')
  async findAllLogins(@Query() query: QueryLoginLogDto) {
    return this.logService.findAllLogins(query);
  }

  @Get('logins/:id')
  async findOneLogin(@Param('id', ParseIntPipe) id: number) {
    return this.logService.findOneLogin(id);
  }

  @Get('logins/statistics')
  async getLoginStatistics(
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('dimension') dimension?: string,
  ) {
    return this.logService.getLoginStatistics(start_date, end_date, dimension);
  }
}
