import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUserDto {
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
  username?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  group_id?: number;

  @IsOptional()
  @IsString()
  @IsIn(['male', 'female', 'unknown'])
  gender?: string;

  @IsOptional()
  @IsString()
  @IsIn(['normal', 'hidden', 'locked'])
  status?: string;

  @IsOptional()
  @IsString()
  created_at_start?: string;

  @IsOptional()
  @IsString()
  created_at_end?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  score_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  score_max?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  balance_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  balance_max?: number;
}
