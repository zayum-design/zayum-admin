import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class DeleteCodeDto {
  @IsString()
  @IsNotEmpty()
  tableName: string;

  @IsOptional()
  @IsBoolean()
  dropTable?: boolean;
}
