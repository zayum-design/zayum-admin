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
 * 通义千问 (Qwen) 提供商
 * 阿里云的 Qwen 系列模型
 */
@Injectable()
export class QwenProvider extends BaseAiProvider {
  readonly provider = AiProvider.QWEN;
  readonly name = '通义千问';

  // 通义千问模型列表
  private readonly availableModels = [
    'qwen-max',
    'qwen-plus',
    'qwen-turbo',
    'qwen-max-longcontext',
    'qwen-coder-plus',
    'text-embedding-v3',
    'text-embedding-v2',
    'text-embedding-v1',
  ];

  constructor(configService: ConfigService) {
    super(configService);
    this.init();
  }

  /**
   * 初始化 OpenAI 客户端
   * 通义千问 API 兼容 OpenAI 格式
   */
  protected initializeClient(): void {
    if (!this.isAvailable()) {
      this.logger.warn('Qwen is not available. Please set AI_QWEN_API_KEY in your environment.');
      return;
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });

    this.logger.log('Qwen client initialized');
  }

  /**
   * 获取后备模型
   */
  protected getFallbackModel(type: AiModelType): string {
    switch (type) {
      case AiModelType.CHAT:
        return 'qwen-turbo';
      case AiModelType.COMPLETION:
        return 'qwen-turbo';
      case AiModelType.EMBEDDING:
        return 'text-embedding-v3';
      default:
        return 'qwen-turbo';
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
      throw new Error('Qwen is not available');
    }

    try {
      const model = request.model || this.getDefaultModel(AiModelType.CHAT);

      const response = await this.client.chat.completions.create({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ? Math.min(request.maxTokens, 8192) : 8192,
        top_p: request.topP ?? 0.95,
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
      throw new Error('Qwen is not available');
    }

    const model = request.model || this.getDefaultModel(AiModelType.CHAT);

    const streamGenerator = async function* (this: QwenProvider) {
      try {
        const stream = await this.client.chat.completions.create({
          model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ? Math.min(request.maxTokens, 8192) : 8192,
          top_p: request.topP ?? 0.95,
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
   * 获取 Embedding
   */
  async embedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!this.isAvailable()) {
      throw new Error('Qwen is not available');
    }

    try {
      const model = request.model || this.getDefaultModel(AiModelType.EMBEDDING);
      const input = Array.isArray(request.input) ? request.input : [request.input];

      const response = await this.client.embeddings.create({
        model,
        input,
      });

      return {
        embeddings: response.data.map((item) => item.embedding),
        model: response.model,
        provider: this.provider,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      this.handleError(error, 'Embedding');
    }
  }
}
