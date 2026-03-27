import { IsString } from 'class-validator';

export class CheckTableDto {
  @IsString()
  tableName: string;
}
