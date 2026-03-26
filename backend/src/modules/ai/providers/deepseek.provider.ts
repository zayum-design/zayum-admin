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
  EmbeddingRequest,
  EmbeddingResponse,
} from '../interfaces/ai-provider.interface';

/**
 * DeepSeek 提供商
 * 支持 DeepSeek-V3、DeepSeek-R1 等模型
 */
@Injectable()
export class DeepseekProvider extends BaseAiProvider {
  readonly provider = AiProvider.DEEPSEEK;
  readonly name = 'DeepSeek';

  // DeepSeek 官方模型列表
  private readonly availableModels = [
    'deepseek-chat',        // DeepSeek-V3
    'deepseek-reasoner',    // DeepSeek-R1
  ];

  constructor(configService: ConfigService) {
    super(configService);
    this.init();
  }

  /**
   * 初始化 OpenAI 客户端
   * DeepSeek API 兼容 OpenAI 格式
   */
  protected initializeClient(): void {
    if (!this.isAvailable()) {
      this.logger.warn('DeepSeek is not available. Please set AI_DEEPSEEK_API_KEY in your environment.');
      return;
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl || 'https://api.deepseek.com/v1',
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });

    this.logger.log('DeepSeek client initialized');
  }

  /**
   * 获取后备模型
   */
  protected getFallbackModel(type: AiModelType): string {
    switch (type) {
      case AiModelType.CHAT:
        return 'deepseek-chat';
      case AiModelType.COMPLETION:
        return 'deepseek-chat';
      case AiModelType.EMBEDDING:
        return 'deepseek-chat';
      default:
        return 'deepseek-chat';
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
      throw new Error('DeepSeek is not available');
    }

    try {
      const model = request.model || this.getDefaultModel(AiModelType.CHAT);

      const response = await this.client.chat.completions.create({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
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
      throw new Error('DeepSeek is not available');
    }

    const model = request.model || this.getDefaultModel(AiModelType.CHAT);

    const streamGenerator = async function* (this: DeepseekProvider) {
      try {
        const stream = await this.client.chat.completions.create({
          model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens,
          top_p: request.topP ?? 1,
          stream: true,
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          
          if (delta?.content || delta?.role) {
            yield {
              id: chunk.id,
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
   * 获取 Embedding
   * DeepSeek 暂时不支持独立的 embedding API，使用兼容方式
   */
  async embedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!this.isAvailable()) {
      throw new Error('DeepSeek is not available');
    }

    // DeepSeek 目前不直接支持 embedding API
    // 可以在这里实现调用其他兼容服务或返回错误
    throw new Error('DeepSeek does not support embedding API yet. Please use other provider for embeddings.');
  }
}
