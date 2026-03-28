import { IsString, IsOptional, IsUrl } from 'class-validator';

export class InstallFromUrlDto {
  @IsUrl({ require_tld: false })
  url: string;  // 插件包下载地址

  @IsOptional()
  @IsString()
  hash?: string;  // 可选的文件哈希校验

  @IsOptional()
  @IsString()
  hashAlgorithm?: string;  // 哈希算法，默认 sha256

  @IsOptional()
  autoEnable?: boolean;  // 安装后自动启用
}
