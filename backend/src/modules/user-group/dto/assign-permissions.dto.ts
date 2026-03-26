import { IsArray, ArrayNotEmpty } from 'class-validator';

export class AssignPermissionsDto {
  @IsArray({ message: '权限ID列表必须是数组' })
  @ArrayNotEmpty({ message: '权限ID列表不能为空' })
  permission_ids: number[];
}
