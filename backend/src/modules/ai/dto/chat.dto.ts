import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class ChatMessageDto {
  @IsString()
  role: 'system' | 'user' | 'assistant';

  @IsString()
  content: string;
}

export class ChatRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  @ArrayMinSize(1)
  messages: ChatMessageDto[];

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsNumber()
  @IsOptional()
  maxTokens?: number;

  @IsNumber()
  @IsOptional()
  topP?: number;

  @IsBoolean()
  @IsOptional()
  stream?: boolean;

  @IsString()
  @IsOptional()
  provider?: string;
}

export class ChatResponseDto {
  id: string;
  content: string;
  role: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: Date;
}

export class ChatStreamChunkDto {
  id: string;
  content: string;
  role?: string;
  finishReason?: string;
  model?: string;
}
