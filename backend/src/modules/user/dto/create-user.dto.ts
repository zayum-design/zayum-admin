import { IsNotEmpty, IsString, MinLength, MaxLength, IsEmail, Matches, IsOptional, IsNumber, IsDateString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'john_doe', minLength: 2, maxLength: 20 })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  @MinLength(2, { message: '用户名至少2个字符' })
  @MaxLength(20, { message: '用户名最多20个字符' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username: string;

  @ApiProperty({ description: '昵称', example: 'John Doe', minLength: 2, maxLength: 50 })
  @IsNotEmpty({ message: '昵称不能为空' })
  @IsString()
  @MinLength(2, { message: '昵称至少2个字符' })
  @MaxLength(50, { message: '昵称最多50个字符' })
  nickname: string;

  @ApiProperty({ description: '密码', example: 'password123', minLength: 6, maxLength: 20 })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  @MinLength(6, { message: '密码至少6个字符' })
  @MaxLength(20, { message: '密码最多20个字符' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, { message: '密码必须包含字母和数字' })
  password: string;

  @ApiProperty({ description: '邮箱', example: 'john.doe@example.com' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsNotEmpty({ message: '手机号不能为空' })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  mobile: string;

  @ApiProperty({ description: '用户组ID', example: 1 })
  @IsNotEmpty({ message: '用户组ID不能为空' })
  @IsNumber()
  group_id: number;

  @ApiPropertyOptional({ description: '头像URL', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: '性别', example: 'male', enum: ['male', 'female', 'unknown'] })
  @IsOptional()
  @IsString()
  @IsIn(['male', 'female', 'unknown'])
  gender?: string = 'unknown';

  @ApiPropertyOptional({ description: '生日', example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiPropertyOptional({ description: '状态', example: 'normal', enum: ['normal', 'hidden', 'locked'] })
  @IsOptional()
  @IsString()
  @IsIn(['normal', 'hidden', 'locked'])
  status?: string = 'normal';

  @ApiPropertyOptional({ description: '积分', example: 100, default: 0 })
  @IsOptional()
  @IsNumber()
  score?: number = 0;

  @ApiPropertyOptional({ description: '余额', example: 1000.5, default: 0 })
  @IsOptional()
  @IsNumber()
  balance?: number = 0;
}
