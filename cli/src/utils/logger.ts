import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export class Logger {
  private logDir: string;
  private currentLogFile: string;
  private sessionId: string;

  constructor() {
    this.logDir = path.join(os.homedir(), '.zayum-cli', 'logs');
    this.sessionId = this.generateSessionId();
    this.currentLogFile = path.join(this.logDir, `${this.sessionId}.log`);
    this.ensureLogDir();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}`;
  }

  private async ensureLogDir(): Promise<void> {
    await fs.ensureDir(this.logDir);
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  async log(level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR', message: string, data?: any): Promise<void> {
    const logMessage = this.formatMessage(level, message);
    const logEntry = data 
      ? `${logMessage}\n${JSON.stringify(data, null, 2)}\n`
      : `${logMessage}\n`;
    
    try {
      await fs.appendFile(this.currentLogFile, logEntry, 'utf-8');
    } catch (error) {
      console.error('写入日志失败:', error);
    }
  }

  async info(message: string, data?: any): Promise<void> {
    await this.log('INFO', message, data);
  }

  async debug(message: string, data?: any): Promise<void> {
    await this.log('DEBUG', message, data);
  }

  async warn(message: string, data?: any): Promise<void> {
    await this.log('WARN', message, data);
  }

  async error(message: string, data?: any): Promise<void> {
    await this.log('ERROR', message, data);
  }

  // 记录用户输入
  async logUserInput(input: string): Promise<void> {
    await this.info('USER_INPUT', { input: input.trim() });
  }

  // 记录 AI 请求
  async logAiRequest(input: string, options: any): Promise<void> {
    await this.debug('AI_REQUEST', { 
      input: input.substring(0, 500), // 限制长度
      options 
    });
  }

  // 记录 AI 响应
  async logAiResponse(response: string, metadata?: any): Promise<void> {
    await this.debug('AI_RESPONSE', {
      response: response.substring(0, 1000), // 限制长度
      length: response.length,
      hasCodeBlocks: response.includes('```'),
      fileMarkers: (response.match(/\/\/\s*FILE:/g) || []).length,
      codeBlocks: (response.match(/```[\s\S]*?```/g) || []).length,
      ...metadata
    });
  }

  // 记录模块名提取
  async logModuleExtraction(moduleName: string | null, source: string): Promise<void> {
    if (moduleName) {
      await this.info('MODULE_EXTRACTED', { moduleName, source });
    } else {
      await this.warn('MODULE_EXTRACTION_FAILED', { source });
    }
  }

  // 记录生成流程
  async logGenerationStart(moduleName: string, queue: string[]): Promise<void> {
    await this.info('GENERATION_START', { moduleName, totalFiles: queue.length, queue });
  }

  async logGenerationProgress(currentIndex: number, currentFile: string): Promise<void> {
    await this.info('GENERATION_PROGRESS', { currentIndex, currentFile });
  }

  async logGenerationComplete(): Promise<void> {
    await this.info('GENERATION_COMPLETE');
  }

  // 记录文件保存
  async logFileSaved(filePath: string): Promise<void> {
    await this.info('FILE_SAVED', { filePath });
  }

  // 记录命令执行
  async logCommand(command: string, args?: string[]): Promise<void> {
    await this.info('COMMAND', { command, args });
  }

  // 获取当前日志文件路径
  getLogFilePath(): string {
    return this.currentLogFile;
  }

  // 获取会话ID
  getSessionId(): string {
    return this.sessionId;
  }

  // 列出所有日志文件
  async listLogs(): Promise<{ file: string; date: Date; size: number }[]> {
    try {
      const files = await fs.readdir(this.logDir);
      const logs: { file: string; date: Date; size: number }[] = [];
      
      for (const file of files.filter(f => f.endsWith('.log'))) {
        const stat = await fs.stat(path.join(this.logDir, file));
        logs.push({
          file,
          date: stat.mtime,
          size: stat.size
        });
      }
      
      return logs.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch {
      return [];
    }
  }
}
