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
 * OpenAI 提供商
 * 支持 GPT-4、GPT-3.5 等模型
 */
@Injectable()
export class OpenaiProvider extends BaseAiProvider {
  readonly provider = AiProvider.OPENAI;
  readonly name = 'OpenAI';

  // OpenAI 官方模型列表（常用）
  private readonly availableModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
    'text-embedding-3-small',
    'text-embedding-3-large',
    'text-embedding-ada-002',
  ];

  constructor(configService: ConfigService) {
    super(configService);
    this.init();
  }

  /**
   * 初始化 OpenAI 客户端
   */
  protected initializeClient(): void {
    if (!this.isAvailable()) {
      this.logger.warn('OpenAI is not available. Please set AI_OPENAI_API_KEY in your environment.');
      return;
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl, // 支持自定义代理
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });

    this.logger.log('OpenAI client initialized');
  }

  /**
   * 获取后备模型
   */
  protected getFallbackModel(type: AiModelType): string {
    switch (type) {
      case AiModelType.CHAT:
        return 'gpt-3.5-turbo';
      case AiModelType.COMPLETION:
        return 'gpt-3.5-turbo';
      case AiModelType.EMBEDDING:
        return 'text-embedding-3-small';
      default:
        return 'gpt-3.5-turbo';
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
      throw new Error('OpenAI is not available');
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
        id: response.id,
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
      throw new Error('OpenAI is not available');
    }

    const model = request.model || this.getDefaultModel(AiModelType.CHAT);

    const streamGenerator = async function* (this: OpenaiProvider) {
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
   * 文本生成（使用 Completions API）
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI is not available');
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
        id: response.id,
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
   */
  async embedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI is not available');
    }

    try {
      const model = this.getDefaultModel(AiModelType.EMBEDDING);
      const input = Array.isArray(request.input) ? request.input : [request.input];

      const response = await this.client.embeddings.create({
        model: request.model || model,
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
