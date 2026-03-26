import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryLoginLogDto {
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
  ip?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  @IsIn(['success', 'failure'])
  status?: string;

  @IsOptional()
  @IsString()
  created_at_start?: string;

  @IsOptional()
  @IsString()
  created_at_end?: string;
}
