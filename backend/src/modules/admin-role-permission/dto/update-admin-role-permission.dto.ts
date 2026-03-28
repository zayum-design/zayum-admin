import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateAdminRolePermissionDto {
  @IsOptional()
  @IsString()
  roleType?: string;

  @IsOptional()
  @IsNumber()
  roleId?: number;

  @IsOptional()
  @IsNumber()
  permissionId?: number;
}