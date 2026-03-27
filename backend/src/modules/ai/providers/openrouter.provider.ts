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
 * OpenRouter 提供商
 * OpenRouter 是一个统一的 AI API 网关，支持多种模型（Claude, GPT, Gemini 等）
 * API 格式与 OpenAI 兼容
 * 文档: https://openrouter.ai/docs
 */
@Injectable()
export class OpenrouterProvider extends BaseAiProvider {
  readonly provider = AiProvider.OPENROUTER;
  readonly name = 'OpenRouter';

  // OpenRouter 支持的常用模型列表（2026年最新）
  private readonly availableModels = [
    // Anthropic Claude 4 系列（2026年最新，1M上下文）
    'anthropic/claude-opus-4.6',           // Opus 4.6 - 最强编程推理（1M上下文）
    'anthropic/claude-opus-4.1',           // Opus 4.1 - 旗舰版
    'anthropic/claude-sonnet-4.6',         // Sonnet 4.6 - 均衡高性能（1M上下文）
    'anthropic/claude-sonnet-4.5',         // Sonnet 4.5 - 最新均衡版
    'anthropic/claude-4-sonnet-20250522',  // Sonnet 4 - 2025年5月版
    'anthropic/claude-haiku-4.5',          // Haiku 4.5 - 极速版（200K上下文）
    // Anthropic Claude 3.7/3.5 系列（旧版）
    'anthropic/claude-3.7-sonnet',
    'anthropic/claude-3.5-sonnet-20241022',
    'anthropic/claude-3.5-sonnet',
    // OpenAI 模型（2026年最新）
    'openai/gpt-5.4',
    'openai/gpt-5.2',
    'openai/gpt-5.1',
    'openai/gpt-5-mini',
    'openai/o3',
    'openai/o3-mini',
    'openai/o4-mini',
    'openai/gpt-4.1',
    'openai/gpt-4o',
    // Google 模型（2026年）
    'google/gemini-2.5-pro',
    'google/gemini-2.5-flash',
    'google/gemini-2.0-flash',
    // DeepSeek 模型（2026年最新）
    'deepseek/deepseek-v4',
    'deepseek/deepseek-chat',
    'deepseek/deepseek-r1',
    // Meta 模型（2026年）
    'meta-llama/llama-4-maverick',
    'meta-llama/llama-4-scout',
    'meta-llama/llama-3.3-70b',
    // 阿里通义千问模型（2026年最新）
    'qwen/qwen3.5-plus',
    'qwen/qwen3-max',
    'qwen/qwen3-coder-plus',
    // Moonshot 模型（2026年最新）
    'moonshot/kimi-k2.5',
    'moonshot/kimi-k2',
    'moonshot/kimi-k1.5',
    // 智谱模型（2026年）
    'zhipu/glm-4.7',
    'zhipu/glm-4.6',
    'zhipu/glm-4.5',
    // MiniMax 模型（2026年最新）
    'minimax/minimax-m2.7',
    'minimax/minimax-m2.5',
    'minimax/minimax-m2.1',
  ];

  constructor(configService: ConfigService) {
    super(configService);
    this.init();
  }

  /**
   * 初始化 OpenRouter 客户端
   */
  protected initializeClient(): void {
    if (!this.isAvailable()) {
      this.logger.warn('OpenRouter is not available. Please set AI_OPENROUTER_API_KEY in your environment.');
      return;
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl || 'https://openrouter.ai/api/v1',
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      defaultHeaders: {
        'HTTP-Referer': this.configService.get<string>('AI_OPENROUTER_REFERER') || 'https://github.com/zayum-admin',
        'X-Title': this.configService.get<string>('AI_OPENROUTER_TITLE') || 'Zayum Admin',
      },
    });

    this.logger.log('OpenRouter client initialized');
  }

  /**
   * 获取后备模型
   */
  protected getFallbackModel(type: AiModelType): string {
    switch (type) {
      case AiModelType.CHAT:
        return 'anthropic/claude-3.5-sonnet';
      case AiModelType.COMPLETION:
        return 'anthropic/claude-3.5-sonnet';
      case AiModelType.EMBEDDING:
        // OpenRouter 不直接支持 embedding，使用 OpenAI 或其他提供商的 embedding
        return 'openai/text-embedding-3-small';
      default:
        return 'anthropic/claude-3.5-sonnet';
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
      throw new Error('OpenRouter is not available');
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
      throw new Error('OpenRouter is not available');
    }

    const model = request.model || this.getDefaultModel(AiModelType.CHAT);

    const streamGenerator = async function* (this: OpenrouterProvider) {
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
      throw new Error('OpenRouter is not available');
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
   * 注意：OpenRouter 主要提供聊天模型，embedding 建议使用专门的提供商
   */
  async embedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenRouter is not available');
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
