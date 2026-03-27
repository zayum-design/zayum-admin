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
 * 智谱 AI (Zhipu AI / GLM) 提供商
 * 智谱 AI 是中国的大模型公司，提供 GLM 系列模型
 * API 格式兼容 OpenAI
 * 文档: https://open.bigmodel.cn/dev/howuse/introduction
 */
@Injectable()
export class ZhipuProvider extends BaseAiProvider {
  readonly provider = AiProvider.ZHIPU;
  readonly name = '智谱 AI (GLM)';

  // 智谱 AI 模型列表（2026年最新）
  private readonly availableModels = [
    // GLM-4.7 系列（2025年12月最新，编程和推理专用）
    'glm-4.7',
    'glm-4.6',
    // GLM-Z1 系列（2025年4月发布，深度推理模型）
    'glm-z1-rumination-32b',   // 32B 沉思型推理模型
    'glm-z1-32b',              // 32B 高性能推理模型
    'glm-z1-9b',               // 9B 轻量推理模型
    // GLM-4.5 系列（主力模型）
    'glm-4.5',
    'glm-4.5-air',
    // GLM-4-Plus 系列（旗舰模型）
    'glm-4-plus',
    'glm-4-0520',
    // GLM-4 标准系列
    'glm-4',
    'glm-4-air',
    'glm-4-airx',
    'glm-4-long',              // 支持 1M 上下文
    // GLM-4-Flash 系列（极速/免费）
    'glm-4-flash',
    'glm-4-flashx',
    // GLM-4V 系列（多模态视觉）
    'glm-4v',
    'glm-4v-plus',
    'glm-4v-flash',
    // GLM-4-9B 开源系列
    'glm-4-9b-chat',
    'glm-4-9b-chat-1m',
    'glm-4v-9b-chat',
    // Embedding 模型
    'embedding-3',
    'embedding-2',
  ];

  constructor(configService: ConfigService) {
    super(configService);
    this.init();
  }

  /**
   * 初始化智谱 AI 客户端
   * 智谱 API 兼容 OpenAI 格式
   */
  protected initializeClient(): void {
    if (!this.isAvailable()) {
      this.logger.warn('智谱 AI is not available. Please set AI_ZHIPU_API_KEY in your environment.');
      return;
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl || 'https://open.bigmodel.cn/api/paas/v4',
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });

    this.logger.log('智谱 AI (GLM) client initialized');
  }

  /**
   * 获取后备模型
   */
  protected getFallbackModel(type: AiModelType): string {
    switch (type) {
      case AiModelType.CHAT:
        return 'glm-4';
      case AiModelType.COMPLETION:
        return 'glm-4';
      case AiModelType.EMBEDDING:
        return 'embedding-3';
      default:
        return 'glm-4';
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
      throw new Error('智谱 AI is not available');
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
      throw new Error('智谱 AI is not available');
    }

    const model = request.model || this.getDefaultModel(AiModelType.CHAT);

    const streamGenerator = async function* (this: ZhipuProvider) {
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
   * 智谱 API 主要支持 chat.completions，这里使用 chat 接口模拟
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (!this.isAvailable()) {
      throw new Error('智谱 AI is not available');
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
    if (!this.isAvailable()) {
      throw new Error('智谱 AI is not available');
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
