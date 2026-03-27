import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
 * Anthropic Claude 提供商
 * 直接集成 Anthropic API，支持 Claude 4/3 系列模型
 * 文档: https://docs.anthropic.com/claude/reference/getting-started-with-the-api
 */
@Injectable()
export class AnthropicProvider extends BaseAiProvider {
  readonly provider = AiProvider.ANTHROPIC;
  readonly name = 'Anthropic Claude';

  // Claude 模型列表（2026年最新，1M上下文）
  private readonly availableModels = [
    // Claude 4 系列（2026年最新旗舰）
    'claude-opus-4-6',
    'claude-opus-4.1',
    'claude-sonnet-4-6',
    'claude-sonnet-4.5',
    'claude-4-sonnet-20250522',
    'claude-haiku-4.5',
    // Claude 3.7/3.5 系列（旧版）
    'claude-3-7-sonnet-20250219',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ];

  constructor(configService: ConfigService) {
    super(configService);
    this.init();
  }

  /**
   * 初始化 Anthropic 客户端
   */
  protected initializeClient(): void {
    if (!this.isAvailable()) {
      this.logger.warn('Anthropic Claude is not available. Please set AI_ANTHROPIC_API_KEY in your environment.');
      return;
    }

    try {
      const Anthropic = require('@anthropic-ai/sdk');
      this.client = new Anthropic({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseUrl,
        timeout: this.config.timeout,
        maxRetries: this.config.maxRetries,
      });
      this.logger.log('Anthropic Claude client initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Anthropic SDK. Please install @anthropic-ai/sdk');
    }
  }

  /**
   * 获取后备模型
   */
  protected getFallbackModel(type: AiModelType): string {
    switch (type) {
      case AiModelType.CHAT:
        return 'claude-sonnet-4-6';
      case AiModelType.COMPLETION:
        return 'claude-sonnet-4-6';
      case AiModelType.EMBEDDING:
        throw new Error('Claude does not support embedding. Please use other provider for embeddings.');
      default:
        return 'claude-sonnet-4-6';
    }
  }

  /**
   * 获取可用模型列表
   */
  getAvailableModels(): string[] {
    return [...this.availableModels];
  }

  /**
   * 转换消息格式为 Claude 格式
   */
  private convertMessages(messages: ChatRequest['messages']): any[] {
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));
  }

  /**
   * 发起对话
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.isAvailable()) {
      throw new Error('Anthropic Claude is not available');
    }

    try {
      const model = request.model || this.getDefaultModel(AiModelType.CHAT);
      const messages = this.convertMessages(request.messages);
      
      const systemMessage = messages.find(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');

      const response = await this.client.messages.create({
        model,
        messages: conversationMessages,
        system: systemMessage?.content,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
        top_p: request.topP ?? 1,
      });

      const content = response.content[0];
      const textContent = content.type === 'text' ? content.text : '';

      return {
        id: response.id,
        content: textContent,
        role: 'assistant',
        model: response.model,
        provider: this.provider,
        usage: response.usage ? {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        } : undefined,
        finishReason: response.stop_reason,
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
      throw new Error('Anthropic Claude is not available');
    }

    const model = request.model || this.getDefaultModel(AiModelType.CHAT);
    const messages = this.convertMessages(request.messages);
    
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const streamGenerator = async function* (this: AnthropicProvider) {
      try {
        const stream = await this.client.messages.create({
          model,
          messages: conversationMessages,
          system: systemMessage?.content,
          max_tokens: request.maxTokens || 4096,
          temperature: request.temperature ?? 0.7,
          top_p: request.topP ?? 1,
          stream: true,
        });

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            yield {
              id: chunk.index?.toString() || this.generateId(),
              content: chunk.delta.text || '',
              model: model,
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
   * 文本生成
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (!this.isAvailable()) {
      throw new Error('Anthropic Claude is not available');
    }

    try {
      const chatRequest: ChatRequest = {
        messages: [{ role: 'user', content: request.prompt }],
        model: request.model || this.getDefaultModel(AiModelType.CHAT),
        temperature: request.temperature,
        maxTokens: request.maxTokens,
      };

      const chatResponse = await this.chat(chatRequest);

      return {
        id: chatResponse.id,
        text: chatResponse.content,
        model: chatResponse.model,
        provider: this.provider,
        usage: chatResponse.usage,
        createdAt: chatResponse.createdAt,
      };
    } catch (error) {
      this.handleError(error, 'Generate');
    }
  }

  /**
   * 获取 Embedding
   */
  async embedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    throw new Error('Anthropic Claude does not support embedding API. Please use other provider for embeddings.');
  }
}
