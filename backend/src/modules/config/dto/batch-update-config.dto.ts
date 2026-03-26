import { IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ConfigItemDto {
  @IsString()
  key: string;

  @IsString()
  value: string;
}

export class BatchUpdateConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigItemDto)
  configs: ConfigItemDto[];
}
