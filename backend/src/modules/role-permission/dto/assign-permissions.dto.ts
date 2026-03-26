import { IsNotEmpty, IsString, IsNumber, IsArray } from 'class-validator';

export class AssignPermissionsDto {
  @IsNotEmpty({ message: '角色类型不能为空' })
  @IsString()
  role_type: 'admin_group' | 'user_group';

  @IsNotEmpty({ message: '角色ID不能为空' })
  @IsNumber()
  role_id: number;

  @IsArray()
  permission_ids: number[];
}
