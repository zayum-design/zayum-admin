import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  provider?: string;
  model?: string;
  temperature?: number;
  stream?: boolean;
}

export interface Session {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    entityName?: string;
    moduleName?: string;
    features?: string[];
  };
}

export class AiService {
  private client: AxiosInstance;
  private sessionsDir: string;
  private currentSession: Session | null = null;
  private apiBaseUrl: string;
  private apiKey: string;

  constructor() {
    // 从环境变量或配置文件读取
    this.apiBaseUrl = process.env.ZAYUM_API_URL || 'http://localhost:3000';
    this.apiKey = process.env.ZAYUM_API_KEY || '';
    
    this.client = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
        'X-CLI-Request': 'true',
        'User-Agent': 'zayum-cli/1.0.0',
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
    });

    // 会话存储目录
    this.sessionsDir = path.join(os.homedir(), '.zayum-cli', 'sessions');
    fs.ensureDirSync(this.sessionsDir);
  }

  /**
   * 发送聊天消息
   */
  async chat(content: string, options: ChatOptions = {}): Promise<string> {
    // 添加到当前会话
    if (this.currentSession) {
      this.currentSession.messages.push({ role: 'user', content });
    }

    const messages = this.currentSession 
      ? this.currentSession.messages 
      : [{ role: 'user', content }];

    try {
      const response = await this.client.post('/ai/chat', {
        messages,
        provider: options.provider,
        model: options.model,
        temperature: options.temperature ?? 0.7,
        maxTokens: 8192,  // 增加输出长度限制，避免代码截断
        stream: false,
      });

      const result = response.data;
      
      if (this.currentSession) {
        this.currentSession.messages.push({ 
          role: 'assistant', 
          content: result.content || result.data?.content 
        });
        this.currentSession.updatedAt = new Date();
        await this.saveSession(this.currentSession);
      }

      return result.content || result.data?.content;
    } catch (error: any) {
      throw new Error(`AI 请求失败: ${error.message}`);
    }
  }

  /**
   * 流式聊天（用于实时显示）
   */
  async *chatStream(content: string, options: ChatOptions = {}): AsyncGenerator<string, void, unknown> {
    if (this.currentSession) {
      this.currentSession.messages.push({ role: 'user', content });
    }

    const messages = this.currentSession 
      ? this.currentSession.messages 
      : [{ role: 'user', content }];

    try {
      const response = await this.client.post(
        '/ai/chat/stream',
        {
          messages,
          provider: options.provider,
          model: options.model,
          temperature: options.temperature ?? 0.7,
          maxTokens: 8192,  // 增加输出长度限制，避免代码截断
        },
        { responseType: 'stream' }
      );

      let fullContent = '';
      
      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                yield parsed.content;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      if (this.currentSession) {
        this.currentSession.messages.push({ 
          role: 'assistant', 
          content: fullContent 
        });
        this.currentSession.updatedAt = new Date();
        await this.saveSession(this.currentSession);
      }
    } catch (error: any) {
      throw new Error(`AI 流式请求失败: ${error.message}`);
    }
  }

  /**
   * 创建新会话
   */
  async createSession(name?: string, systemPrompt?: string): Promise<Session> {
    const session: Session = {
      id: this.generateId(),
      name: name || `会话 ${new Date().toLocaleString()}`,
      messages: systemPrompt ? [{ role: 'system', content: systemPrompt }] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.currentSession = session;
    await this.saveSession(session);
    return session;
  }

  /**
   * 加载会话
   */
  async loadSession(sessionId: string): Promise<Session | null> {
    try {
      const sessionPath = path.join(this.sessionsDir, `${sessionId}.json`);
      if (!await fs.pathExists(sessionPath)) return null;
      
      const data = await fs.readJson(sessionPath);
      this.currentSession = data;
      return data;
    } catch {
      return null;
    }
  }

  /**
   * 获取所有会话
   */
  async listSessions(): Promise<Session[]> {
    const files = await fs.readdir(this.sessionsDir);
    const sessions: Session[] = [];
    
    for (const file of files.filter(f => f.endsWith('.json'))) {
      try {
        const data = await fs.readJson(path.join(this.sessionsDir, file));
        sessions.push(data);
      } catch {
        // 忽略损坏的会话文件
      }
    }
    
    return sessions.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * 保存会话
   */
  private async saveSession(session: Session): Promise<void> {
    const sessionPath = path.join(this.sessionsDir, `${session.id}.json`);
    await fs.writeJson(sessionPath, session, { spaces: 2 });
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    const sessionPath = path.join(this.sessionsDir, `${sessionId}.json`);
    await fs.remove(sessionPath);
    
    if (this.currentSession?.id === sessionId) {
      this.currentSession = null;
    }
  }

  /**
   * 获取当前会话
   */
  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  /**
   * 更新会话元数据
   */
  async updateSessionMetadata(metadata: Session['metadata']): Promise<void> {
    if (this.currentSession) {
      this.currentSession.metadata = { ...this.currentSession.metadata, ...metadata };
      await this.saveSession(this.currentSession);
    }
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels(): Promise<Array<{ key: string; name: string; models: string[] }>> {
    try {
      const response = await this.client.get('/ai/providers');
      return response.data.data || response.data;
    } catch {
      // 返回默认值
      return [
        { key: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-reasoner'] },
        { key: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-3.5-turbo'] },
      ];
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
