import { Observable } from 'rxjs';
import { AiModelType, AiProvider } from '../enums/ai-provider.enum';

/**
 * 消息角色
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * 聊天请求参数
 */
export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  [key: string]: any;
}

/**
 * 聊天响应
 */
export interface ChatResponse {
  id: string;
  content: string;
  role: MessageRole;
  model: string;
  provider: AiProvider;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  createdAt: Date;
}

/**
 * 流式响应块
 */
export interface ChatStreamChunk {
  id: string;
  content: string;
  role?: MessageRole;
  finishReason?: string;
  model?: string;
}

/**
 * 文本生成请求
 */
export interface GenerateRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}

/**
 * 文本生成响应
 */
export interface GenerateResponse {
  id: string;
  text: string;
  model: string;
  provider: AiProvider;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: Date;
}

/**
 * Embedding 请求
 */
export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

/**
 * Embedding 响应
 */
export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  provider: AiProvider;
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * AI 提供商配置
 */
export interface AiProviderConfig {
  provider: AiProvider;
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  models?: Partial<Record<AiModelType, string>>;
  timeout?: number;
  maxRetries?: number;
  enabled: boolean;
}

/**
 * AI 提供商接口 - 所有提供商必须实现
 */
export interface IAiProvider {
  /**
   * 提供商类型
   */
  readonly provider: AiProvider;

  /**
   * 提供商名称
   */
  readonly name: string;

  /**
   * 是否可用
   */
  isAvailable(): boolean;

  /**
   * 发起对话
   */
  chat(request: ChatRequest): Promise<ChatResponse>;

  /**
   * 流式对话
   */
  chatStream(request: ChatRequest): Observable<ChatStreamChunk>;

  /**
   * 文本生成
   */
  generate?(request: GenerateRequest): Promise<GenerateResponse>;

  /**
   * 获取 Embedding
   */
  embedding?(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  /**
   * 获取可用模型列表
   */
  getAvailableModels(): string[];

  /**
   * 获取默认模型
   */
  getDefaultModel(type?: AiModelType): string;
}
