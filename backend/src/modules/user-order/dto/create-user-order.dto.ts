import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSysUserOrderDto {
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  user_id: number;

  @IsNotEmpty()
  @IsString()
  order_no: string;

  @IsNotEmpty()
  @IsString()
  order_type: string;

  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  amount: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  pay_amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsNotEmpty()
  @IsString()
  status: string;

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