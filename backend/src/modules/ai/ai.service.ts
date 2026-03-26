import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import {
  DeepseekProvider,
  OpenaiProvider,
  QwenProvider,
  MoonshotProvider,
} from './providers';
import { IAiProvider, ChatRequest, ChatResponse, ChatStreamChunk, GenerateRequest, GenerateResponse, EmbeddingRequest, EmbeddingResponse } from './interfaces/ai-provider.interface';
import { AiProvider } from './enums/ai-provider.enum';

/**
 * AI 服务
 * 统一管理多个 AI 提供商，支持动态切换
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly providers: Map<AiProvider, IAiProvider> = new Map();
  private readonly defaultProvider: AiProvider;

  constructor(private readonly configService: ConfigService) {
    // 初始化所有提供商
    this.initializeProviders();
    
    // 设置默认提供商
    const defaultProviderStr = this.configService.get<string>('AI_DEFAULT_PROVIDER', 'deepseek');
    this.defaultProvider = defaultProviderStr as AiProvider;
    
    this.logger.log(`AI Service initialized. Default provider: ${this.defaultProvider}`);
    this.logger.log(`Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
  }

  /**
   * 初始化所有提供商
   */
  private initializeProviders(): void {
    const providers = [
      { key: AiProvider.DEEPSEEK, class: DeepseekProvider },
      { key: AiProvider.OPENAI, class: OpenaiProvider },
      { key: AiProvider.QWEN, class: QwenProvider },
      { key: AiProvider.MOONSHOT, class: MoonshotProvider },
    ];

    for (const { key, class: ProviderClass } of providers) {
      try {
        const provider = new ProviderClass(this.configService);
        if (provider.isAvailable()) {
          this.providers.set(key, provider);
          this.logger.log(`Registered AI provider: ${provider.name}`);
        } else {
          this.logger.warn(`AI provider ${key} is not available (missing API key)`);
        }
      } catch (error) {
        this.logger.error(`Failed to initialize ${key} provider: ${error.message}`);
      }
    }
  }

  /**
   * 获取指定提供商
   */
  getProvider(provider?: AiProvider | string): IAiProvider {
    const providerKey = (provider || this.defaultProvider) as AiProvider;
    
    const instance = this.providers.get(providerKey);
    if (!instance) {
      const available = Array.from(this.providers.keys()).join(', ') || 'none';
      throw new NotFoundException(
        `AI provider '${providerKey}' not found or not available. Available providers: ${available}`
      );
    }
    
    return instance;
  }

  /**
   * 获取所有可用提供商
   */
  getAvailableProviders(): Array<{ key: string; name: string; models: string[] }> {
    return Array.from(this.providers.entries()).map(([key, provider]) => ({
      key,
      name: provider.name,
      models: provider.getAvailableModels(),
    }));
  }

  /**
   * 检查提供商是否可用
   */
  isProviderAvailable(provider: AiProvider | string): boolean {
    return this.providers.has(provider as AiProvider);
  }

  /**
   * 发起对话
   */
  async chat(request: ChatRequest, provider?: AiProvider | string): Promise<ChatResponse> {
    const aiProvider = this.getProvider(provider);
    return aiProvider.chat(request);
  }

  /**
   * 流式对话
   */
  chatStream(request: ChatRequest, provider?: AiProvider | string): Observable<ChatStreamChunk> {
    const aiProvider = this.getProvider(provider);
    return aiProvider.chatStream(request);
  }

  /**
   * 文本生成
   */
  async generate(request: GenerateRequest, provider?: AiProvider | string): Promise<GenerateResponse> {
    const aiProvider = this.getProvider(provider);
    
    if (!aiProvider.generate) {
      throw new BadRequestException(`Provider ${aiProvider.name} does not support text generation`);
    }
    
    return aiProvider.generate(request);
  }

  /**
   * 获取 Embedding
   */
  async embedding(request: EmbeddingRequest, provider?: AiProvider | string): Promise<EmbeddingResponse> {
    const aiProvider = this.getProvider(provider);
    
    if (!aiProvider.embedding) {
      throw new BadRequestException(`Provider ${aiProvider.name} does not support embeddings`);
    }
    
    return aiProvider.embedding(request);
  }

  /**
   * 智能路由 - 根据负载或策略选择最佳提供商
   */
  async smartChat(request: ChatRequest): Promise<ChatResponse> {
    // 简单策略：优先使用默认提供商，如果不可用则按顺序尝试
    const providers = [this.defaultProvider, ...Array.from(this.providers.keys())];
    
    for (const providerKey of providers) {
      const provider = this.providers.get(providerKey);
      if (provider?.isAvailable()) {
        try {
          return await provider.chat(request);
        } catch (error) {
          this.logger.warn(`Provider ${provider.name} failed, trying next...`);
        }
      }
    }
    
    throw new Error('No available AI provider');
  }

  /**
   * 健康检查 - 检查所有提供商状态
   */
  async healthCheck(): Promise<Array<{ provider: string; status: 'healthy' | 'unhealthy'; message?: string }>> {
    const results: Array<{ provider: string; status: 'healthy' | 'unhealthy'; message?: string }> = [];
    
    for (const [key, provider] of this.providers) {
      try {
        // 简单测试调用
        const testRequest: ChatRequest = {
          messages: [{ role: 'user', content: 'Hello' }],
          maxTokens: 5,
        };
        
        await provider.chat(testRequest);
        results.push({ provider: key, status: 'healthy' });
      } catch (error) {
        results.push({ 
          provider: key, 
          status: 'unhealthy', 
          message: error.message 
        });
      }
    }
    
    return results;
  }
}
