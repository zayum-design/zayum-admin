import { IsString, IsOptional, IsEnum, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryNotificationDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  pageSize?: number = 10;

  @IsEnum(['admin', 'user'])
  @IsOptional()
  userType?: 'admin' | 'user';

  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(['system', 'message', 'email'])
  @IsOptional()
  type?: 'system' | 'message' | 'email';

  @IsString()
  @IsOptional()
  isRead?: string;

  @IsDateString()
  @IsOptional()
  createdAtStart?: string;

  @IsDateString()
  @IsOptional()
  createdAtEnd?: string;
}
