import { Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  IAiProvider,
  AiProviderConfig,
  ChatRequest,
  ChatResponse,
  ChatStreamChunk,
  GenerateRequest,
  GenerateResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  MessageRole,
} from '../interfaces/ai-provider.interface';
import { AiProvider, AiModelType } from '../enums/ai-provider.enum';

/**
 * AI 提供商抽象基类
 * 所有具体提供商都应继承此类
 */
export abstract class BaseAiProvider implements IAiProvider {
  protected readonly logger: Logger;
  protected config: AiProviderConfig;
  protected client: OpenAI | any;

  abstract readonly provider: AiProvider;
  abstract readonly name: string;

  constructor(protected readonly configService: ConfigService) {
    this.logger = new Logger(this.constructor.name);
    // 注意：子类必须在设置 provider 后调用 init()
  }

  /**
   * 初始化（由子类调用）
   */
  protected init(): void {
    this.loadConfig();
  }

  /**
   * 加载配置
   */
  protected loadConfig(): void {
    const prefix = `AI_${this.provider.toUpperCase()}`;
    
    // 初始化 models 对象
    const models: Partial<Record<AiModelType, string>> = {};
    
    // 加载各类型模型配置
    const chatModel = this.configService.get<string>(`${prefix}_CHAT_MODEL`);
    const completionModel = this.configService.get<string>(`${prefix}_COMPLETION_MODEL`);
    const embeddingModel = this.configService.get<string>(`${prefix}_EMBEDDING_MODEL`);

    if (chatModel) models[AiModelType.CHAT] = chatModel;
    if (completionModel) models[AiModelType.COMPLETION] = completionModel;
    if (embeddingModel) models[AiModelType.EMBEDDING] = embeddingModel;

    const defaultModel = this.configService.get<string>(`${prefix}_DEFAULT_MODEL`);

    // 如果没有设置特定类型的模型，使用默认模型
    if (defaultModel) {
      if (!models[AiModelType.CHAT]) {
        models[AiModelType.CHAT] = defaultModel;
      }
      if (!models[AiModelType.COMPLETION]) {
        models[AiModelType.COMPLETION] = defaultModel;
      }
    }
    
    this.config = {
      provider: this.provider,
      apiKey: this.configService.get<string>(`${prefix}_API_KEY`) || '',
      baseUrl: this.configService.get<string>(`${prefix}_BASE_URL`),
      defaultModel,
      timeout: this.configService.get<number>(`${prefix}_TIMEOUT`) || 30000,
      maxRetries: this.configService.get<number>(`${prefix}_MAX_RETRIES`) || 3,
      enabled: this.configService.get<boolean>(`${prefix}_ENABLED`) !== false,
      models,
    };

    this.initializeClient();
  }

  /**
   * 初始化客户端
   */
  protected abstract initializeClient(): void;

  /**
   * 检查是否可用
   */
  isAvailable(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }

  /**
   * 获取默认模型
   */
  getDefaultModel(type: AiModelType = AiModelType.CHAT): string {
    return this.config.models?.[type] || this.config.defaultModel || this.getFallbackModel(type);
  }

  /**
   * 获取后备模型（子类可覆盖）
   */
  protected abstract getFallbackModel(type: AiModelType): string;

  /**
   * 获取可用模型列表
   */
  abstract getAvailableModels(): string[];

  /**
   * 发起对话
   */
  abstract chat(request: ChatRequest): Promise<ChatResponse>;

  /**
   * 流式对话
   */
  abstract chatStream(request: ChatRequest): Observable<ChatStreamChunk>;

  /**
   * 文本生成（可选）
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    // 默认使用 chat 接口实现
    const chatRequest: ChatRequest = {
      messages: [{ role: 'user', content: request.prompt }],
      model: request.model,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    };

    const response = await this.chat(chatRequest);

    return {
      id: response.id,
      text: response.content,
      model: response.model,
      provider: response.provider,
      usage: response.usage,
      createdAt: response.createdAt,
    };
  }

  /**
   * 获取 Embedding（可选）
   */
  async embedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    throw new Error(`Embedding not supported by ${this.name}`);
  }

  /**
   * 生成唯一ID
   */
  protected generateId(): string {
    return `${this.provider}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 创建流式响应
   */
  protected createStreamObservable(
    streamGenerator: () => AsyncGenerator<ChatStreamChunk>,
  ): Observable<ChatStreamChunk> {
    return new Observable((subscriber) => {
      const generator = streamGenerator();

      (async () => {
        try {
          for await (const chunk of generator) {
            if (subscriber.closed) break;
            subscriber.next(chunk);
          }
          subscriber.complete();
        } catch (error) {
          this.logger.error(`Stream error: ${error.message}`, error.stack);
          subscriber.error(error);
        }
      })();

      return () => {
        // 清理逻辑
      };
    });
  }

  /**
   * 处理错误
   */
  protected handleError(error: any, operation: string): never {
    this.logger.error(`${operation} failed: ${error.message}`, error.stack);
    
    if (error.status) {
      // OpenAI 风格的错误
      throw new Error(`${this.name} API Error (${error.status}): ${error.message}`);
    }
    
    throw new Error(`${this.name} ${operation} failed: ${error.message}`);
  }
}
