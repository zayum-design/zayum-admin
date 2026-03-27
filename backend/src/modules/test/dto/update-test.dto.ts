import { IsOptional, IsString, IsNumber, IsBoolean, IsDate } from 'class-validator';

export class UpdateSysTestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  keu?: string;

  @IsOptional()
  @IsString()
  stadsaf?: string;

  @IsOptional()
  @IsDate()
  fasd?: Date;

  @IsOptional()
  @IsDate()
  afds?: Date;
}