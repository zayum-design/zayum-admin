import { IsString, IsOptional, IsEmail, Matches, MaxLength, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nickname?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  mobile?: string;

  @IsEnum(['male', 'female', 'unknown'])
  @IsOptional()
  gender?: 'male' | 'female' | 'unknown';

  @IsString()
  @IsOptional()
  birthday?: string;
}
