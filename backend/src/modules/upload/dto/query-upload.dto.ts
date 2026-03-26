import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUploadDto {
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
  user_type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  extension?: string;

  @IsOptional()
  @IsString()
  filename?: string;
}
