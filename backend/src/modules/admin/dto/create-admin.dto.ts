import { IsNotEmpty, IsString, MinLength, MaxLength, IsEmail, Matches, IsOptional, IsNumber } from 'class-validator';

export class CreateAdminDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  @MinLength(2, { message: '用户名至少2个字符' })
  @MaxLength(20, { message: '用户名最多20个字符' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username: string;

  @IsNotEmpty({ message: '昵称不能为空' })
  @IsString()
  @MinLength(2, { message: '昵称至少2个字符' })
  @MaxLength(50, { message: '昵称最多50个字符' })
  nickname: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  @MinLength(6, { message: '密码至少6个字符' })
  @MaxLength(20, { message: '密码最多20个字符' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, { message: '密码必须包含字母和数字' })
  password: string;

  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsNotEmpty({ message: '手机号不能为空' })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  mobile: string;

  @IsNotEmpty({ message: '管理员组ID不能为空' })
  @IsNumber()
  group_id: number;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  status?: string = 'normal';
}
