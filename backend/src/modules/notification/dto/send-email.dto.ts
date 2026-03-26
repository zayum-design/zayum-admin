import { IsString, IsNotEmpty, IsOptional, IsEmail, MaxLength } from 'class-validator';

export class SendEmailDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(200)
  to: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  attachments?: string;
}
