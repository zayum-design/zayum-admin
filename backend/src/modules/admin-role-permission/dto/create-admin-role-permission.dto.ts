import { IsString, IsNumber } from 'class-validator';

export class CreateAdminRolePermissionDto {
  @IsString()
  roleType: string;

  @IsNumber()
  roleId: number;

  @IsNumber()
  permissionId: number;
}