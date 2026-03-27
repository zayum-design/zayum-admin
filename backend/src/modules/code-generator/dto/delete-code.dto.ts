import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteCodeDto {
  @IsString()
  @IsNotEmpty()
  tableName: string;
}
