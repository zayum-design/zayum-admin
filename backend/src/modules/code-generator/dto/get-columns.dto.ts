import { IsString } from 'class-validator';

export class GetColumnsDto {
  @IsString()
  tableName: string;
}
