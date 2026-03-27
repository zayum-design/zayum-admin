import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDecimal, IsIn, IsIP, Length } from 'class-validator';

export class CreateUserScoreDto {
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsNumber({}, { message: '用户ID必须是数字' })
  user_id: number;

  @IsOptional()
  @IsNumber({}, { message: '管理员ID必须是数字' })
  admin_id?: number;

  @IsNotEmpty({ message: '积分场景不能为空' })
  @IsString({ message: '积分场景必须是字符串' })
  @Length(1, 50, { message: '积分场景长度必须在1-50个字符之间' })
  scene: string;

  @IsNotEmpty({ message: '变更积分不能为空' })
  @IsDecimal({}, { message: '变更积分必须是数字' })
  change_score: number;

  @IsNotEmpty({ message: '变更前积分不能为空' })
  @IsDecimal({}, { message: '变更前积分必须是数字' })
  before_score: number;

  @IsNotEmpty({ message: '变更后积分不能为空' })
  @IsDecimal({}, { message: '变更后积分必须是数字' })
  after_score: number;

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