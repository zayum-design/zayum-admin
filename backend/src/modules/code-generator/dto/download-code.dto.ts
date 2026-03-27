import { IsString, IsArray, ArrayNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class DownloadCodeDto {
  @IsString()
  tableName: string;

  @IsArray()
  @ArrayNotEmpty()
  columns: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    // 处理字符串 'true' 或 'false'，以及实际的布尔值
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  writeFiles?: boolean;
}
