import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QuerySysUserOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  order_no?: string;

  @IsOptional()
  @IsString()
  order_type?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  pay_method?: string;

  @IsOptional()
  @IsString()
  pay_trade_no?: string;

  @IsOptional()
  @IsString()
  pay_data?: string;

  @IsOptional()
  @IsString()
  snapshot?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;

  @IsOptional()
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  amount?: number;

  @IsOptional()
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  pay_amount?: number;
}