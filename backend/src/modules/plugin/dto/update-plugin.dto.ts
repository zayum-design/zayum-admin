import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';

export class UpdatePluginDto {
  @IsOptional()
  @IsEnum(['installed', 'enabled', 'disabled'])
  status?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
