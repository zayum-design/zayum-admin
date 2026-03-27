import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class GenerateCodeDto {
  @IsString()
  tableName: string;

  @IsArray()
  @ArrayNotEmpty()
  columns: string[];
}
