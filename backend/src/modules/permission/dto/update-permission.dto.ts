import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class UpdatePermissionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  parent_id?: number;

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

  @IsString()
  @IsIn(['normal', 'hidden'])
  @IsOptional()
  status?: string;
}
