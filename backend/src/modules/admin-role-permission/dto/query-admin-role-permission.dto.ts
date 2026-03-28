import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAdminRolePermissionDto {
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
  roleType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  roleId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  permissionId?: number;
}