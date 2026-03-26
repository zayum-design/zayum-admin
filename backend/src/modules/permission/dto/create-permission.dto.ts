import { IsNotEmpty, IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreatePermissionDto {
  @IsNumber()
  @IsOptional()
  parent_id?: number;

  @IsNotEmpty({ message: '权限名称不能为空' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: '权限代码不能为空' })
  @IsString()
  code: string;

  @IsString()
  @IsIn(['menu', 'button', 'api'])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  component?: string;

  @IsNumber()
  @IsOptional()
  sort?: number;
}
