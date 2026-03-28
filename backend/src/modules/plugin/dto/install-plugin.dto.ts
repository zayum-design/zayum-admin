import { IsString, IsOptional, IsObject } from 'class-validator';

export class InstallPluginDto {
  @IsString()
  pluginPath: string;  // 插件本地路径

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
