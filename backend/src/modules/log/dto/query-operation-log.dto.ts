import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryOperationLogDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  @IsIn(['admin', 'user'])
  user_type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  @IsIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
  method?: string;

  @IsOptional()
  @IsString()
  @IsIn(['success', 'failure'])
  status?: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  created_at_start?: string;

  @IsOptional()
  @IsString()
  created_at_end?: string;
}
