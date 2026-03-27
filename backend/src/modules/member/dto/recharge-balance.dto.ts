import { IsNumber, IsNotEmpty, IsPositive, IsOptional, IsString } from 'class-validator';

export class RechargeBalanceDto {
  @IsNumber()
  @IsNotEmpty({ message: '充值金额不能为空' })
  @IsPositive({ message: '充值金额必须大于0' })
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
