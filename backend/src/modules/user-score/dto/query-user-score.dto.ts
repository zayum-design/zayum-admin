import { IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUserScoreDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  user_id?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  admin_id?: number;

  @IsOptional()
  @IsString()
  scene?: string;

  @IsOptional()
  @IsString()
  order_no?: string;

  @IsOptional()
  @IsDateString()
  start_time?: string;

  @IsOptional()
  @IsDateString()
  end_time?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page_size?: number = 20;
}