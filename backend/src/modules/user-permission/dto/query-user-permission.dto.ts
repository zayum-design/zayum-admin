import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QuerySysUserPermissionDto {
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
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  component?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  parent_id?: number;

  @IsOptional()
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  sort?: number;
}