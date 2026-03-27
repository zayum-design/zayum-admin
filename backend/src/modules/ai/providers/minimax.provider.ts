import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Observable } from 'rxjs';
import { BaseAiProvider } from './base.provider';
import { AiProvider, AiModelType } from '../enums/ai-provider.enum';
import {
  ChatRequest,
  ChatResponse,
  ChatStreamChunk,
  GenerateRequest,
  GenerateResponse,
  EmbeddingRequest,
  EmbeddingResponse,
} from '../interfaces/ai-provider.interface';

/**
 * MiniMax 提供商
 * MiniMax 是一家中国的 AI 公司，提供大语言模型服务
 * API 格式兼容 OpenAI
 * 文档: https://www.minimaxi.com/document
 */
@Injectable()
export class MinimaxProvider extends BaseAiProvider {
  readonly provider = AiProvider.MINIMAX;
  readonly name = 'MiniMax';

  // MiniMax 模型列表（2026年最新）
  private readonly availableModels = [
    // M2.7 系列（2026年3月最新，递归自改进模型）
    'MiniMax-M2.7',
    'MiniMax-M2.7-highspeed',
    // M2.5 系列（2026年2月发布，编程和 Agent 专用）
    'MiniMax-M2.5',
    'MiniMax-M2.5-highspeed',
    // M2.1 系列（2025年12月发布，多语言编程）
    'MiniMax-M2.1',
    'MiniMax-M2.1-highspeed',
    // M2 系列（Agent 时代入门模型）
    'MiniMax-M2',
    'MiniMax-M2-highspeed',
    // MiniMax-Text-01 系列（开源，4M上下文）
    'minimax-text-01',
    'minimax-vl-01',
    // abab6.5 系列（旧版 MoE）
    'abab6.5-chat',
    'abab6.5s-chat',
  ];

  constructor(configService: ConfigService) {
    super(configService);
    this.init();
  }

  /**
   * 初始化 MiniMax 客户端
   * MiniMax API 兼容 OpenAI 格式
   */
  protected initializeClient(): void {
    if (!this.isAvailable()) {
      this.logger.warn('MiniMax is not available. Please set AI_MINIMAX_API_KEY in your environment.');
      return;
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl || 'https://api.minimaxi.chat/v1',
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });

    this.logger.log('MiniMax client initialized');
  }

  /**
   * 获取后备模型
   */
  protected getFallbackModel(type: AiModelType): string {
    switch (type) {
      case AiModelType.CHAT:
        return 'minimax-text-01';
      case AiModelType.COMPLETION:
        return 'minimax-text-01';
      case AiModelType.EMBEDDING:
        // MiniMax 暂不支持 embedding，返回默认值
        return 'minimax-text-01';
      default:
        return 'minimax-text-01';
    }
  }

  /**
   * 获取可用模型列表
   */
  getAvailableModels(): string[] {
    return [...this.availableModels];
  }

  /**
   * 发起对话
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.isAvailable()) {
      throw new Error('MiniMax is not available');
    }

    try {
      const model = request.model || this.getDefaultModel(AiModelType.CHAT);

      const response = await this.client.chat.completions.create({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ? Math.min(request.maxTokens, 16384) : undefined,
        top_p: request.topP ?? 1,
        stream: false,
      });

      const choice = response.choices[0];

      return {
        id: response.id || this.generateId(),
        content: choice.message.content || '',
        role: choice.message.role,
        model: response.model,
        provider: this.provider,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
        finishReason: choice.finish_reason,
        createdAt: new Date(),
      };
    } catch (error) {
      this.handleError(error, 'Chat');
    }
  }

  /**
   * 流式对话
   */
  chatStream(request: ChatRequest): Observable<ChatStreamChunk> {
    if (!this.isAvailable()) {
      throw new Error('MiniMax is not available');
    }

    const model = request.model || this.getDefaultModel(AiModelType.CHAT);

    const streamGenerator = async function* (this: MinimaxProvider) {
      try {
        const stream = await this.client.chat.completions.create({
          model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ? Math.min(request.maxTokens, 16384) : undefined,
          top_p: request.topP ?? 1,
          stream: true,
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          
          if (delta?.content || delta?.role) {
            yield {
              id: chunk.id || this.generateId(),
              content: delta.content || '',
              role: delta.role,
              model: chunk.model,
              finishReason: chunk.choices[0]?.finish_reason,
            } as ChatStreamChunk;
          }
        }
      } catch (error) {
        this.logger.error(`Stream error: ${error.message}`);
        throw error;
      }
    }.bind(this);

    return this.createStreamObservable(streamGenerator);
  }

  /**
   * 文本生成（使用 Completions API）
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (!this.isAvailable()) {
      throw new Error('MiniMax is not available');
    }

    try {
      const model = request.model || this.getDefaultModel(AiModelType.COMPLETION);

      const response = await this.client.completions.create({
        model,
        prompt: request.prompt,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ? Math.min(request.maxTokens, 16384) : undefined,
      });

      const choice = response.choices[0];

      return {
        id: response.id || this.generateId(),
        text: choice.text || '',
        model: response.model,
        provider: this.provider,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
        createdAt: new Date(),
      };
    } catch (error) {
      this.handleError(error, 'Generate');
    }
  }

  /**
   * 获取 Embedding
   * MiniMax 暂不支持独立的 embedding API
   */
  async embedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!this.isAvailable()) {
      throw new Error('MiniMax is not available');
    }

    throw new Error('MiniMax does not support embedding API yet. Please use other provider for embeddings.');
  }
}
