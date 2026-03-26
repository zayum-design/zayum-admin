import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GenerateRequestDto {
  @IsString()
  prompt: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsNumber()
  @IsOptional()
  maxTokens?: number;

  @IsString()
  @IsOptional()
  provider?: string;
}

export class GenerateResponseDto {
  id: string;
  text: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: Date;
}
