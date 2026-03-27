import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  tableName: string;

  @IsString()
  menuName: string;

  @IsOptional()
  @IsString()
  parentCode?: string;

  @IsOptional()
  @IsNumber()
  sort?: number;
}
