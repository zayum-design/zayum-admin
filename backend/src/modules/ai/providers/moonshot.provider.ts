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
 * Moonshot (Kimi) 提供商
 * 月之暗面的 Kimi 系列模型
 */
@Injectable()
export class MoonshotProvider extends BaseAiProvider {
  readonly provider = AiProvider.MOONSHOT;
  readonly name = 'Moonshot (Kimi)';

  // Moonshot 模型列表（2026年最新，包含 Kimi K2.5）
  private readonly availableModels = [
    // Kimi K2.5 系列（2026年1月最新发布，256K上下文，多模态）
    'kimi-k2.5',
    'kimi-k2.5-highspeed',
    // Kimi K2 系列（主力模型，1T参数）
    'kimi-k2',
    'kimi-k2-turbo',
    'kimi-k2-thinking',
    'kimi-k2-thinking-turbo',
    // Kimi K1.5 系列（推理专用）
    'kimi-k1.5',
    'kimi-k1.5-long-context',
    // Kimi V1 系列
    'kimi-v1',
    'kimi-v1-mapi',
    // 标准模型（旧版兼容）
    'moonshot-v1-8k',
    'moonshot-v1-32k',
    'moonshot-v1-128k',
    'moonshot-v1-auto',
  ];

  constructor(configService: ConfigService) {
    super(configService);
    this.init();
  }

  /**
   * 初始化 OpenAI 客户端
   * Moonshot API 兼容 OpenAI 格式
   */
  protected initializeClient(): void {
    if (!this.isAvailable()) {
      this.logger.warn('Moonshot is not available. Please set AI_MOONSHOT_API_KEY in your environment.');
      return;
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl || 'https://api.moonshot.cn/v1',
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });

    this.logger.log('Moonshot client initialized');
  }

  /**
   * 获取后备模型
   */
  protected getFallbackModel(type: AiModelType): string {
    switch (type) {
      case AiModelType.CHAT:
        return 'moonshot-v1-8k';
      case AiModelType.COMPLETION:
        return 'moonshot-v1-8k';
      case AiModelType.EMBEDDING:
        return 'moonshot-v1-8k';
      default:
        return 'moonshot-v1-8k';
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
      throw new Error('Moonshot is not available');
    }

    try {
      const model = request.model || this.getDefaultModel(AiModelType.CHAT);

      const response = await this.client.chat.completions.create({
        model,
        messages: request.messages,
        temperature: 1,  // Kimi K2.5 只接受 temperature=1
        max_tokens: request.maxTokens ? Math.min(request.maxTokens, 32768) : 32768,
        top_p: 0.95,
        stream: false,
      });

      const choice = response.choices[0];
      
      // Kimi K2.5 模型返回的内容在 reasoning_content 中
      const content = (choice.message as any).reasoning_content || choice.message.content || '';

      return {
        id: response.id || this.generateId(),
        content: content,
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
      throw new Error('Moonshot is not available');
    }

    const model = request.model || this.getDefaultModel(AiModelType.CHAT);

    const streamGenerator = async function* (this: MoonshotProvider) {
      try {
        const stream = await this.client.chat.completions.create({
          model,
          messages: request.messages,
          temperature: 1,  // Kimi K2.5 只接受 temperature=1
          max_tokens: request.maxTokens ? Math.min(request.maxTokens, 32768) : 32768,
          top_p: 0.95,
          stream: true,
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          
          // Kimi K2.5 模型返回的内容在 reasoning_content 中
          const content = delta?.reasoning_content || delta?.content || '';
          
          if (content || delta?.role) {
            yield {
              id: chunk.id || this.generateId(),
              content: content,
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
   * Moonshot 暂时不支持独立的 embedding API
   */
  async embedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!this.isAvailable()) {
      throw new Error('Moonshot is not available');
    }

    throw new Error('Moonshot does not support embedding API yet. Please use other provider for embeddings.');
  }
}
