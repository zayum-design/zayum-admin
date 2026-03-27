import { IsString, IsOptional } from 'class-validator';

export class GenerateFieldsDto {
  @IsString()
  prompt: string;

  @IsString()
  @IsOptional()
  tableName?: string;

  @IsString()
  @IsOptional()
  tableComment?: string;
}

export interface GeneratedField {
  name: string;
  type: string;
  comment?: string;
  isNullable?: boolean;
  isPrimaryKey?: boolean;
}

export interface GenerateFieldsResponse {
  fields: GeneratedField[];
}
