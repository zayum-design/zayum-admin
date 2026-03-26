import { IsString, IsOptional, IsEmail, Matches, IsNumber, IsIn, MinLength } from 'class-validator';

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '昵称至少2个字符' })
  nickname?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: '密码至少6个字符' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, { message: '密码必须包含字母和数字' })
  password?: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  mobile?: string;

  @IsOptional()
  @IsNumber()
  group_id?: number;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  @IsIn(['normal', 'hidden'])
  status?: string;
}
