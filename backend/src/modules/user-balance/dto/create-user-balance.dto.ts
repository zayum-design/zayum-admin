import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDecimal, IsIP, Length } from 'class-validator';

export class CreateUserBalanceDto {
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsNumber({}, { message: '用户ID必须是数字' })
  user_id: number;

  @IsOptional()
  @IsNumber({}, { message: '管理员ID必须是数字' })
  admin_id?: number;

  @IsNotEmpty({ message: '余额场景不能为空' })
  @IsString({ message: '余额场景必须是字符串' })
  @Length(1, 50, { message: '余额场景长度必须在1-50个字符之间' })
  scene: string;

  @IsNotEmpty({ message: '变更余额不能为空' })
  @IsDecimal({}, { message: '变更余额必须是数字' })
  change_balance: number;

  @IsNotEmpty({ message: '变更前余额不能为空' })
  @IsDecimal({}, { message: '变更前余额必须是数字' })
  before_balance: number;

  @IsNotEmpty({ message: '变更后余额不能为空' })
  @IsDecimal({}, { message: '变更后余额必须是数字' })
  after_balance: number;

  @IsOptional()
  @IsString({ message: '备注必须是字符串' })
  @Length(0, 500, { message: '备注长度不能超过500个字符' })
  remark?: string;

  @IsOptional()
  @IsString({ message: '订单号必须是字符串' })
  @Length(0, 100, { message: '订单号长度不能超过100个字符' })
  order_no?: string;

  @IsOptional()
  @IsIP(4, { message: 'IP地址格式不正确' })
  ip?: string;
}
