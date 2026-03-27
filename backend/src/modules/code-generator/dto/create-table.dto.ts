import { IsString, IsArray, ArrayNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateTableFieldDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  isNullable?: boolean;

  @IsOptional()
  @IsBoolean()
  isPrimaryKey?: boolean;
}

export class CreateTableDto {
  @IsString()
  tableName: string;

  @IsOptional()
  @IsString()
  tableComment?: string;

  @IsArray()
  @ArrayNotEmpty()
  fields: CreateTableFieldDto[];
}
