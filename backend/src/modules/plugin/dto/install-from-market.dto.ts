import { IsString, IsOptional, IsUrl } from 'class-validator';

export class InstallFromMarketDto {
  @IsString()
  name: string;  // 插件名称

  @IsOptional()
  @IsString()
  version?: string;  // 指定版本，不指定则安装最新版

  @IsOptional()
  @IsUrl({ require_tld: false })
  marketUrl?: string;  // 插件市场地址，默认使用配置的市场

  @IsOptional()
  autoEnable?: boolean;  // 安装后自动启用
}
