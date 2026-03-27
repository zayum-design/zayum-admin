import { IsOptional, IsString } from 'class-validator';

export class GetTablesDto {
  @IsOptional()
  @IsString()
  keyword?: string;
}
