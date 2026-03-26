import { IsNotEmpty, IsString, MaxLength, IsOptional, IsIn } from 'class-validator';

export class CreateUserGroupDto {
  @IsNotEmpty({ message: '组名不能为空' })
  @IsString()
  @MaxLength(50, { message: '组名最多50个字符' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '描述最多200个字符' })
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['normal', 'hidden'])
  status?: string = 'normal';
}
