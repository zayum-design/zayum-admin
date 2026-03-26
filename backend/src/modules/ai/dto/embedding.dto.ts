import { IsArray, IsOptional, IsString } from 'class-validator';

export class EmbeddingRequestDto {
  @IsString({ each: true })
  input: string | string[];

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  provider?: string;
}

export class EmbeddingResponseDto {
  embeddings: number[][];
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}
