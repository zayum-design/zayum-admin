import { IsString, IsNotEmpty, Length, IsIn } from 'class-validator';

export class SendSmsCodeDto {
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  @Length(11, 11, { message: '手机号必须为11位' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: '类型不能为空' })
  @IsIn(['register', 'login', 'reset'], { message: '类型必须是 register、login 或 reset' })
  type: string;
}
