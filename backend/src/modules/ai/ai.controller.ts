import {
  Controller,
  Post,
  Body,
  Query,
  Get,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { CliPublic } from '../../common/decorators/cli-public.decorator';
import { AiService } from './ai.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';
import { GenerateRequestDto, GenerateResponseDto } from './dto/generate.dto';
import { EmbeddingRequestDto, EmbeddingResponseDto } from './dto/embedding.dto';
import { AiProvider } from './enums/ai-provider.enum';

@Controller('ai')
@CliPublic()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * 发起对话
   */
  @Post('chat')
  async chat(
    @Body() dto: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    const response = await this.aiService.chat(
      {
        messages: dto.messages,
        model: dto.model,
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
        topP: dto.topP,
        stream: false,
      },
      dto.provider as AiProvider,
    );

    return {
      id: response.id,
      content: response.content,
      role: response.role,
      model: response.model,
      provider: response.provider,
      usage: response.usage,
      createdAt: response.createdAt,
    };
  }

  /**
   * 流式对话（SSE）
   */
  @Post('chat/stream')
  async chatStream(
    @Body() dto: ChatRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    const response = this.aiService.chatStream(
      {
        messages: dto.messages,
        model: dto.model,
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
        topP: dto.topP,
        stream: true,
      },
      dto.provider as AiProvider,
    );

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    response.subscribe({
      next: (chunk) => {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      },
      error: (error) => {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      },
      complete: () => {
        res.write('data: [DONE]\n\n');
        res.end();
      },
    });
  }

  /**
   * 文本生成
   */
  @Post('generate')
  async generate(
    @Body() dto: GenerateRequestDto,
  ): Promise<GenerateResponseDto> {
    const response = await this.aiService.generate(
      {
        prompt: dto.prompt,
        model: dto.model,
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
      },
      dto.provider as AiProvider,
    );

    return {
      id: response.id,
      text: response.text,
      model: response.model,
      provider: response.provider,
      usage: response.usage,
      createdAt: response.createdAt,
    };
  }

  /**
   * 获取文本 Embedding
   */
  @Post('embedding')
  async embedding(
    @Body() dto: EmbeddingRequestDto,
  ): Promise<EmbeddingResponseDto> {
    const response = await this.aiService.embedding(
      {
        input: dto.input,
        model: dto.model,
      },
      dto.provider as AiProvider,
    );

    return {
      embeddings: response.embeddings,
      model: response.model,
      provider: response.provider,
      usage: response.usage,
    };
  }

  /**
   * 获取可用 AI 提供商列表
   */
  @Get('providers')
  getProviders() {
    return this.aiService.getAvailableProviders();
  }

  /**
   * 健康检查
   */
  @Get('health')
  async healthCheck() {
    return this.aiService.healthCheck();
  }
}
