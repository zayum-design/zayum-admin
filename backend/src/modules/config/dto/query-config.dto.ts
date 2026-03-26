import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryConfigDto {
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
  category?: string;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsString()
  is_public?: string;
}
