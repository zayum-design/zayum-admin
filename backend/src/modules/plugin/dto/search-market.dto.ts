import { IsString, IsOptional, IsUrl } from 'class-validator';

export class SearchMarketDto {
  @IsString()
  keyword: string;  // 搜索关键词

  @IsOptional()
  @IsUrl({ require_tld: false })
  marketUrl?: string;  // 指定市场地址

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}
