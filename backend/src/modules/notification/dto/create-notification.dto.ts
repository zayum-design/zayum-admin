import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(['system', 'message', 'email'])
  @IsOptional()
  type?: 'system' | 'message' | 'email' = 'system';

  @IsString()
  @IsOptional()
  link?: string;

  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  userId: number;

  @IsEnum(['admin', 'user'])
  @IsOptional()
  userType?: 'admin' | 'user' = 'user';
}
