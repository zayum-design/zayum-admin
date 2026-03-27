/**
 * AI 模型提供商枚举
 */
export enum AiProvider {
  DEEPSEEK = 'deepseek',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic', // Anthropic Claude
  QWEN = 'qwen',        // 通义千问
  MOONSHOT = 'moonshot', // Kimi / Moonshot
  OPENROUTER = 'openrouter', // OpenRouter
  MINIMAX = 'minimax',  // MiniMax
  ZHIPU = 'zhipu',      // 智谱 AI (GLM)
  CUSTOM = 'custom',
}

/**
 * 模型类型枚举
 */
export enum AiModelType {
  CHAT = 'chat',
  COMPLETION = 'completion',
  EMBEDDING = 'embedding',
}
