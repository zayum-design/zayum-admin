import { IsOptional, IsString, IsNumber, IsBoolean, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateSysUserOrderDto {
  @IsOptional()
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsString()
  order_no?: string;

  @IsOptional()
  @IsString()
  order_type?: string;

  @IsOptional()
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  amount?: number;

  @IsOptional()
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  pay_amount?: number;

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
  extra_data?: object;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;

  @IsOptional()
  @IsDate()
  paid_at?: Date;

  @IsOptional()
  @IsDate()
  cancelled_at?: Date;

  @IsOptional()
  @IsDate()
  completed_at?: Date;

  @IsOptional()
  @IsDate()
  expired_at?: Date;
}