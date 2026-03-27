import { IsString, IsNotEmpty, Length, IsOptional, IsIn } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  @Length(11, 11, { message: '手机号必须为11位' })
  phone: string;

  @IsOptional()
  @IsString()
  @Length(6, 20, { message: '密码长度为6-20位' })
  password?: string;

  @IsOptional()
  @IsString()
  @Length(6, 6, { message: '验证码必须为6位' })
  code?: string;

  @IsString()
  @IsNotEmpty({ message: '登录类型不能为空' })
  @IsIn(['password', 'sms'], { message: '登录类型必须是 password 或 sms' })
  loginType: string;
}
