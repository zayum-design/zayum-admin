import { IsOptional, IsString, Length, IsEmail, IsIn } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: '昵称长度为1-50位' })
  nickname?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @IsOptional()
  @IsString()
  @IsIn(['male', 'female', 'unknown'], { message: '性别格式不正确' })
  gender?: string;

  @IsOptional()
  @IsString()
  birthday?: string;
}
