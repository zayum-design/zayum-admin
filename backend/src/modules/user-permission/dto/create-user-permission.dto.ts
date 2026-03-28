import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSysUserPermissionDto {
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  parent_id: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  code: string;

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
  @Transform(({ value }) => Number(value))
  @IsNumber()
  sort?: number;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  description?: string;
}