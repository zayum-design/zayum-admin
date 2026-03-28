import { IsOptional, IsString, IsNumber, IsBoolean, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateSysUserPermissionDto {
  @IsOptional()
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  parent_id?: number;

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
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  sort?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;
}