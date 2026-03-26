import { IsString, IsOptional, IsBoolean, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateConfigDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['string', 'number', 'boolean', 'json'])
  type?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort?: number;
}
