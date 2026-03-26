import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/, {
    message: '新密码必须包含字母和数字，长度6-20位',
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
