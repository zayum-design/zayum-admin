import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConfigDto {
  @IsNotEmpty({ message: '配置分类不能为空' })
  @IsString()
  category: string;

  @IsNotEmpty({ message: '配置键不能为空' })
  @IsString()
  key: string;

  @IsNotEmpty({ message: '配置值不能为空' })
  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['string', 'number', 'boolean', 'json'])
  type?: string = 'string';

  @IsOptional()
  @IsBoolean()
  is_public?: boolean = false;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort?: number = 0;
}
