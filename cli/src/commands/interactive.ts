import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs-extra';
import * as path from 'path';
import { AiService, Session } from '../services/ai-service';
import { CodeGenerator, CodeGenerationResult } from '../services/code-generator';
import { ProjectAnalyzer, ProjectStructure } from '../utils/project-analyzer';
import { prompt } from '../utils/prompt';
import { Logger } from '../utils/logger';

export class InteractiveCommand {
  private aiService: AiService;
  private projectAnalyzer: ProjectAnalyzer;
  private projectStructure: ProjectStructure | null = null;
  private codeGenerator: CodeGenerator | null = null;
  private currentProvider: string = 'deepseek';
  private currentModel: string = 'deepseek-chat';
  private running: boolean = false;
  private generationQueue: string[] = [];
  private currentGenerationIndex: number = -1;
  private pendingModuleName: string = '';
  private logger: Logger;

  constructor() {
    this.aiService = new AiService();
    this.projectAnalyzer = new ProjectAnalyzer();
    this.logger = new Logger();
  }

  /**
   * 启动交互式 CLI
   */
  async start(): Promise<void> {
    console.log(chalk.cyan.bold('\n🚀 Zayum CLI - AI 代码生成器\n'));

    // 获取并显示实际AI配置
    try {
      const config = await this.aiService.getDefaultConfig();
      this.currentProvider = config.provider;
      this.currentModel = config.model;
      console.log(chalk.gray(`厂商${config.providerName}，模型：${config.model}`));
    } catch {
      console.log(chalk.gray(`厂商${this.currentProvider}，模型：${this.currentModel}`));
    }
    console.log();

    // 分析项目结构
    const spinner = ora({ text: '正在分析项目结构...', spinner: 'dots' }).start();
    try {
      this.projectStructure = await this.projectAnalyzer.analyze();
      spinner.succeed(chalk.green('项目结构分析完成'));
    } catch (error: any) {
      spinner.fail(chalk.red(`项目分析失败: ${error.message}`));
      return;
    }

    if (this.projectStructure.type === 'unknown') {
      console.log(chalk.yellow('⚠️ 未能识别项目类型，部分功能可能不可用'));
    } else {
      console.log(chalk.green(`✓ 检测到项目类型: ${this.projectStructure.type}`));
      if (this.projectStructure.backend) {
        console.log(chalk.gray(`  后端: ${this.projectStructure.backend.framework}`));
      }
      if (this.projectStructure.frontend) {
        console.log(chalk.gray(`  前端: ${this.projectStructure.frontend.framework}`));
      }
    }

    this.codeGenerator = new CodeGenerator(this.projectStructure);

    // 创建新会话
    await this.createNewSession();

    // 开始交互循环
    this.running = true;
    await this.interactiveLoop();
  }

  /**
   * 创建新会话
   */
  private async createNewSession(): Promise<void> {
    const systemPrompt = await this.loadSystemPromptFromFile();
    const session = await this.aiService.createSession(
      `会话 ${new Date().toLocaleString()}`,
      systemPrompt
    );
    console.log(chalk.green(`\n✓ 已创建新会话: ${session.id.slice(0, 8)}...`));
    console.log(chalk.gray(`日志文件: ${this.logger.getLogFilePath()}`));
    
    // 显示欢迎提示，等待用户输入
    console.log(chalk.cyan('\n请描述您想要创建的功能，例如：'));
    console.log(chalk.gray('  - 创建一个用户积分管理模块'));
    console.log(chalk.gray('  - 帮我生成一个订单管理功能'));
    console.log(chalk.gray('  - 输入 /help 查看帮助\n'));
  }

  /**
   * 从 MD 文件加载系统提示词
   */
  private async loadSystemPromptFromFile(): Promise<string> {
    try {
      // 读取 SOUL.md（基础人格）
      const soulPath = path.join(process.cwd(), 'backend', 'src', 'modules', 'ai', 'SOUL.md');
      const soulContent = await fs.readFile(soulPath, 'utf-8');
      
      // 读取 MODE.md（交互模式）
      const modePath = path.join(process.cwd(), 'backend', 'src', 'modules', 'ai', 'MODE.md');
      let modeContent = await fs.readFile(modePath, 'utf-8');
      
      // 替换项目结构占位符
      const projectStructure = this.projectAnalyzer.generateStructureDescription(this.projectStructure!);
      modeContent = modeContent.replace('{{PROJECT_STRUCTURE}}', projectStructure);
      
      // 添加强制性单文件生成约束 - 使用简单格式避免转义问题
      const strictSingleFileRule = [
        '',
        '---',
        '',
        '## 强制执行规则（违反会导致系统故障）',
        '',
        '### 单文件生成模式（最高优先级）',
        '',
        '每次回复只能包含一个代码块，严禁多个代码块',
        '',
        '当用户要求生成文件时，必须遵守：',
        '1. 只生成一个文件 - 当前指定的这个文件',
        '2. 只包含一个代码块 - 回复中只能有一个 ``` 代码块',
        '3. 禁止多个代码块 - 绝对不要生成多个 ``` 代码块',
        '4. 禁止标题 - 不要输出 "## 后端代码"、"### 实体文件" 等',
        '5. 禁止预告 - 不要输出 "接下来生成..."、"下一个文件..." 等文字',
        '6. 禁止解释 - 不要解释代码功能',
        '',
        '错误示例（严禁）：',
        '## 1. 实体文件',
        '```typescript',
        '// FILE: xxx.entity.ts',
        '...代码...',
        '```',
        '',
        '## 2. DTO文件',
        '```typescript',
        '// FILE: xxx.dto.ts',
        '...代码...',
        '```',
        '',
        '正确示例（必须）：',
        '已生成: backend/src/entities/sys-xxx.entity.ts',
        '',
        '输入 /save 保存',
        '',
        '```typescript',
        '// FILE: backend/src/entities/sys-xxx.entity.ts',
        '...代码...',
        '```',
        '',
        '违反此规则会导致文件保存失败，系统无法正常工作'
      ].join('\n');
      
      // 合并提示词
      return `${soulContent}\n\n---\n\n${modeContent}\n${strictSingleFileRule}\n\n## 开始指令\n\n直接询问模块类型，只输出选项列表，禁止任何多余文字。`;
    } catch (error) {
      console.log(chalk.yellow('警告: 无法读取 MD 配置文件，使用默认提示词'));
      return '你是一个专业的全栈开发助手。';
    }
1  }

  /**
   * 交互循环
   */
  private async interactiveLoop(): Promise<void> {
    while (this.running) {
      try {
        const input = await prompt(chalk.blue('> '));
        
        if (!input || !input.trim()) continue;

        // 记录用户输入
        await this.logger.logUserInput(input);

        // 处理命令
        if (input.startsWith('/')) {
          const shouldContinue = await this.handleCommand(input);
          if (!shouldContinue) {
            this.running = false;
            break;
          }
          continue;
        }

        // 检查是否是确认生成命令
        if (this.isConfirmGeneration(input)) {
          await this.logger.info('CONFIRM_GENERATION_COMMAND', { input });
          // 从会话中提取模块名
          const moduleName = this.extractModuleNameFromSession();
          await this.logger.logModuleExtraction(moduleName, 'session_messages_or_metadata');
          
          if (moduleName) {
            // 更新会话元数据，记录确认的模块名
            await this.aiService.updateSessionMetadata({ 
              moduleName: moduleName,
              entityName: moduleName 
            });
            await this.startGeneration(moduleName);
            continue;
          } else {
            console.log(chalk.yellow('\n⚠️ 未能识别模块名，请确认之前的对话中已确定实体名称'));
            // 打印会话信息供调试
            const session = this.aiService.getCurrentSession();
            await this.logger.warn('MODULE_EXTRACTION_FAILED_DETAILS', {
              sessionExists: !!session,
              messageCount: session?.messages.length || 0,
              lastMessages: session?.messages.slice(-3).map(m => ({
                role: m.role,
                content: m.content.substring(0, 200)
              }))
            });
            continue;
          }
        }

        // 检查是否是代码生成后的选择
        if (this.isCodeGenerationChoice(input)) {
          await this.handleCodeGenerationChoice(input);
          continue;
        }

        // 发送到 AI
        await this.sendToAi(input);
      } catch (error: any) {
        console.log(chalk.red(`错误: ${error.message}`));
      }
    }

    console.log(chalk.yellow('\n👋 再见！'));
    process.exit(0);
  }

  /**
   * 检查是否是代码生成后的选择
   */
  private isCodeGenerationChoice(input: string): boolean {
    const trimmedInput = input.trim();
    
    // 只有在有代码生成后才检查选择
    if (!['1', '2', '3'].includes(trimmedInput)) {
      return false;
    }
    
    // 检查最后一条AI消息是否包含代码
    const session = this.aiService.getCurrentSession();
    if (!session || session.messages.length === 0) {
      return false;
    }
    
    // 获取最后一条AI回复
    const lastAiMessage = [...session.messages].reverse().find(m => m.role === 'assistant');
    if (!lastAiMessage) {
      return false;
    }
    
    // 检查是否包含代码块
    return lastAiMessage.content.includes('```');
  }

  /**
   * 处理代码生成后的选择
   */
  private async handleCodeGenerationChoice(input: string): Promise<void> {
    const choice = input.trim();
    
    switch (choice) {
      case '1':
        // 保存当前文件
        await this.handleSaveCode();
        break;
      case '2':
        // 修改代码 - 提示用户输入修复内容
        console.log(chalk.cyan('\n请输入修改内容（描述需要修复的问题）:'));
        const fixInput = await prompt(chalk.blue('> '));
        if (fixInput && fixInput.trim()) {
          await this.sendToAi(`请修复以下问题: ${fixInput}`);
        }
        break;
      case '3':
        // 预览代码
        await this.handlePreviewCode();
        break;
      default:
        console.log(chalk.red('无效的选择'));
    }
  }

  /**
   * 检查是否是确认生成
   */
  private isConfirmGeneration(input: string): boolean {
    const trimmedInput = input.trim().toLowerCase();
    
    // 明确的确认关键词
    const explicitConfirmKeywords = ['确认生成', '开始生成', '生成', '确认', '开始'];
    
    // 检查是否是明确的确认指令
    if (explicitConfirmKeywords.some(keyword => trimmedInput === keyword)) {
      return true;
    }
    
    // 检查是否是数字选项（仅在显示确认菜单时才表示确认）
    // 这里需要检查当前会话状态，但为了简单起见，我们只检查是否是"1"且不是其他上下文
    // 实际上，更好的方法是在会话元数据中记录当前状态
    if (trimmedInput === '1') {
      // 检查最后一条AI消息是否包含确认菜单
      const session = this.aiService.getCurrentSession();
      if (session && session.messages.length > 0) {
        const lastAiMessage = [...session.messages].reverse().find(m => m.role === 'assistant');
        if (lastAiMessage && lastAiMessage.content.includes('确认生成')) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * 从会话中提取模块名
   */
  private extractModuleNameFromSession(): string | null {
    const session = this.aiService.getCurrentSession();
    if (!session) return null;
    
    // 1. 优先从会话元数据中获取
    if (session.metadata?.entityName) {
      return session.metadata.entityName;
    }
    if (session.metadata?.moduleName) {
      return session.metadata.moduleName;
    }
    
    // 2. 从最后几条消息中提取模块名
    for (let i = session.messages.length - 1; i >= 0; i--) {
      const msg = session.messages[i];
      if (msg.role === 'assistant') {
        // 尝试从消息中提取模块名 - 支持多种格式
        // sys-user-score, user-score, UserScore 等
        const patterns = [
          /实体名称[:\s]+([a-zA-Z0-9_-]+)/i,
          /模块[:\s]+([a-zA-Z0-9_-]+)/i,
          /entity[:\s]+([a-zA-Z0-9_-]+)/i,
          /`sys-([a-zA-Z0-9_-]+)`/,
          /\*\*sys-([a-zA-Z0-9_-]+)\*\*/,
          /sys-([a-zA-Z0-9_-]+)\.entity\.ts/,
        ];
        
        for (const pattern of patterns) {
          const match = msg.content.match(pattern);
          if (match) {
            const extracted = match[1].replace(/^sys-/, '').trim();
            // 确保提取的不是选项编号（如"[2]"）
            if (extracted && !extracted.match(/^\[\d+\]$/)) {
              return extracted;
            }
          }
        }
        
        // 尝试从文件路径中提取
        const filePathPattern = /FILE:\s+[^\s]+\/([a-zA-Z0-9_-]+)\.[a-z]+/;
        const fileMatch = msg.content.match(filePathPattern);
        if (fileMatch) {
          const fileName = fileMatch[1];
          // 如果是实体文件，去掉sys-前缀
          if (fileName.startsWith('sys-')) {
            return fileName.replace('sys-', '');
          }
          return fileName;
        }
      }
    }
    return null;
  }

  /**
   * 转换为短横线连接命名 (kebab-case)
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')  // 在小写和大写之间加横线
      .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')  // 处理连续大写
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/^-/, '');  // 移除开头的横线
  }

  /**
   * 开始逐个生成文件
   */
  private async startGeneration(moduleName: string): Promise<void> {
    // 转换为短横线连接格式
    this.pendingModuleName = this.toKebabCase(moduleName);
    
    // 初始化生成队列（按照修正后的MODE.md规范）
    this.generationQueue = [
      `backend/src/database/add_${this.pendingModuleName}_table.sql`,  // 数据库迁移脚本（第一步）
      `backend/src/entities/sys-${this.pendingModuleName}.entity.ts`,  // 实体文件（第二步）
      `backend/src/modules/${this.pendingModuleName}/dto/create-${this.pendingModuleName}.dto.ts`,
      `backend/src/modules/${this.pendingModuleName}/dto/update-${this.pendingModuleName}.dto.ts`,
      `backend/src/modules/${this.pendingModuleName}/dto/query-${this.pendingModuleName}.dto.ts`,
      `backend/src/modules/${this.pendingModuleName}/${this.pendingModuleName}.service.ts`,
      `backend/src/modules/${this.pendingModuleName}/${this.pendingModuleName}.controller.ts`,
      `backend/src/modules/${this.pendingModuleName}/${this.pendingModuleName}.module.ts`,
    ];
    
    this.currentGenerationIndex = 0;
    
    // 记录生成开始
    await this.logger.logGenerationStart(this.pendingModuleName, this.generationQueue);
    
    console.log(chalk.cyan(`\n开始生成 ${this.pendingModuleName} 模块，共 ${this.generationQueue.length} 个文件`));
    console.log(chalk.gray(`日志文件: ${this.logger.getLogFilePath()}`));
    console.log(chalk.gray(`生成顺序: 1.数据库迁移 → 2.实体文件 → 3.DTO → 4.服务 → 5.控制器 → 6.模块`));
    
    // 请求生成第一个文件（明确指定单文件模式）
    const firstFile = this.generationQueue[0];
    await this.sendToAi(
      `请生成文件: ${firstFile}，模块名: ${this.pendingModuleName}\n\n` +
      `重要提示：\n` +
      `1. 只生成这一个文件，不要生成其他文件\n` +
      `2. 只包含一个代码块\n` +
      `3. 代码块第一行必须是: // FILE: ${firstFile}\n` +
      `4. 不要输出 "## 后端代码" 等标题\n` +
      `5. 不要输出 "接下来生成..." 等预告文字\n` +
      `6. 如果是SQL文件，使用SQL语法；如果是TypeScript文件，使用TypeScript语法`
    );
  }

  /**
   * 处理命令
   */
  private async handleCommand(input: string): Promise<boolean> {
    const parts = input.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // 记录命令执行
    await this.logger.logCommand(command, args);

    switch (command) {
      case '/help':
      case '/h':
        this.showHelp();
        break;

      case '/new':
        await this.handleNewSession();
        break;

      case '/model':
        await this.handleModelSwitch(args);
        break;

      case '/provider':
        await this.handleProviderSwitch(args);
        break;

      case '/sessions':
        await this.handleListSessions();
        break;

      case '/switch':
        await this.handleSwitchSession(args[0]);
        break;

      case '/save':
        await this.handleSaveCode();
        break;

      case '/preview':
        await this.handlePreviewCode();
        break;

      case '/status':
        await this.showStatus();
        break;

      case '/clear':
        console.clear();
        break;

      case '/logs':
        await this.handleShowLogs();
        break;

      case '/exit':
      case '/quit':
      case '/q':
        return false;

      default:
        console.log(chalk.red(`未知命令: ${command}，输入 /help 查看帮助`));
    }

    return true;
  }

  /**
   * 发送消息到 AI（流式输出）
   */
  private async sendToAi(input: string): Promise<void> {
    process.stdout.write(chalk.green('AI: '));
    
    let fullResponse = '';
    
    try {
      // 如果在生成队列中，追加单文件生成提示
      let finalInput = input;
      const inGenerationMode = this.currentGenerationIndex >= 0 && this.currentGenerationIndex < this.generationQueue.length;
      
      if (inGenerationMode) {
        const currentFile = this.generationQueue[this.currentGenerationIndex];
        const strictRules = [
          '',
          '强制执行规则（违反会导致系统故障）：',
          '',
          `1. 只生成一个文件: ${currentFile}`,
          '2. 只包含一个代码块 - 回复中只能有一个 ``` 代码块',
          '3. 禁止多个代码块 - 绝对不要生成多个 ``` 代码块',
          '4. 禁止标题 - 不要输出 "## 后端代码"、"### 实体文件" 等标题',
          '5. 禁止预告 - 不要输出 "接下来生成..."、"下一个文件..." 等文字',
          '6. 格式要求:',
          `   - 代码块第一行必须是: // FILE: ${currentFile}`,
          '   - 前面写: 已生成: ${currentFile}',
          '   - 然后写: 输入 /save 保存',
          '   - 然后是代码块',
          '',
          '错误示例（严禁）：',
          '## 1. 实体文件',
          '```typescript',
          '// FILE: xxx.entity.ts',
          '...',
          '```',
          '',
          '## 2. DTO文件',
          '```typescript',
          '// FILE: xxx.dto.ts',
          '...',
          '```',
          '',
          '正确示例（必须）：',
          `已生成: ${currentFile}`,
          '',
          '输入 /save 保存',
          '',
          '```typescript',
          `// FILE: ${currentFile}`,
          '...代码...',
          '```',
          '',
          `再次强调：只能有一个代码块，只能生成 ${currentFile} 这一个文件`
        ].join('\n');
        finalInput = input + '\n' + strictRules;
        await this.logger.logGenerationProgress(this.currentGenerationIndex, currentFile);
      }
      
      // 记录 AI 请求
      await this.logger.logAiRequest(finalInput, {
        provider: this.currentProvider,
        model: this.currentModel,
        inGenerationMode,
        generationIndex: this.currentGenerationIndex
      });
      
      // 使用流式输出
      for await (const chunk of this.aiService.chatStream(finalInput, {
        provider: this.currentProvider,
        model: this.currentModel,
      })) {
        process.stdout.write(chunk);
        fullResponse += chunk;
      }
      
      console.log(); // 换行
      
      // 记录 AI 响应
      await this.logger.logAiResponse(fullResponse, {
        inGenerationMode,
        generationIndex: this.currentGenerationIndex
      });
      
      // 检查是否包含代码
      if (fullResponse.includes('```')) {
        // 检查 AI 是否遵守了单文件生成规则
        const fileMarkers = fullResponse.match(/\/\/\s*FILE:/g);
        const codeBlocks = fullResponse.match(/```[\s\S]*?```/g);
        
        if (this.currentGenerationIndex >= 0 && this.generationQueue.length > 0) {
          // 在单文件生成模式下
          if (!fileMarkers || fileMarkers.length === 0) {
            console.log(chalk.yellow('\n⚠️ 警告: AI 未添加 FILE 标记，可能无法正确识别文件路径'));
            await this.logger.warn('AI_MISSING_FILE_MARKER');
          }
          if (codeBlocks && codeBlocks.length > 1) {
            console.log(chalk.yellow('\n⚠️ 警告: AI 生成了多个代码块，应该只生成一个'));
            await this.logger.warn('AI_MULTIPLE_CODE_BLOCKS', { count: codeBlocks.length });
          }
        }
        console.log(chalk.cyan('\n请选择:'));
        console.log(chalk.gray('  [1] 保存当前文件'));
        console.log(chalk.gray('  [2] 修改代码（回复修复内容）'));
        console.log(chalk.gray('  [3] 预览代码'));
      }
    } catch (error: any) {
      console.log(chalk.red(`\n请求失败: ${error.message}`));
      await this.logger.error('AI_REQUEST_FAILED', { error: error.message });
      
      // 检查是否已经收到了部分响应
      const hasPartialResponse = fullResponse.length > 0;
      const hasCodeBlock = fullResponse.includes('```');
      const hasFileMarker = fullResponse.includes('// FILE:');
      
      // 在生成队列模式下，提供重试选项
      if (this.currentGenerationIndex >= 0 && this.currentGenerationIndex < this.generationQueue.length) {
        const currentFile = this.generationQueue[this.currentGenerationIndex];
        
        // 如果已经收到了完整的代码块，可能文件已经生成成功
        if (hasCodeBlock && hasFileMarker) {
          console.log(chalk.yellow(`\n⚠️ 网络中断，但可能已收到完整文件: ${currentFile}`));
          console.log(chalk.gray('检测到代码块和文件标记，文件可能已生成成功'));
          console.log(chalk.cyan('\n请选择:'));
          console.log(chalk.gray('  [1] 尝试保存当前文件（如果已生成）'));
          console.log(chalk.gray('  [2] 重试生成当前文件'));
          console.log(chalk.gray('  [3] 跳过当前文件，继续下一个'));
          console.log(chalk.gray('  [4] 取消生成队列'));
        } else {
          console.log(chalk.yellow(`\n⚠️ 生成文件失败: ${currentFile}`));
          console.log(chalk.gray('可能的原因:'));
          console.log(chalk.gray('  1. 网络连接问题'));
          console.log(chalk.gray('  2. AI 服务暂时不可用'));
          console.log(chalk.gray('  3. 请求超时'));
          console.log(chalk.cyan('\n请选择:'));
          console.log(chalk.gray('  [1] 重试当前文件'));
          console.log(chalk.gray('  [2] 跳过当前文件，继续下一个'));
          console.log(chalk.gray('  [3] 取消生成队列'));
        }
        
        // 等待用户选择
        const choice = await prompt(chalk.blue('> '));
        
        if (choice === '1') {
          if (hasCodeBlock && hasFileMarker) {
            // 尝试保存当前文件
            console.log(chalk.cyan(`\n尝试保存文件: ${currentFile}`));
            // 记录AI响应，然后尝试保存
            await this.logger.logAiResponse(fullResponse, {
              inGenerationMode: true,
              generationIndex: this.currentGenerationIndex
            });
            
            // 检查是否包含代码
            if (fullResponse.includes('```')) {
              console.log(chalk.cyan('\n请选择:'));
              console.log(chalk.gray('  [1] 保存当前文件'));
              console.log(chalk.gray('  [2] 修改代码（回复修复内容）'));
              console.log(chalk.gray('  [3] 预览代码'));
            }
          } else {
            // 重试当前文件
            console.log(chalk.cyan(`\n重试生成: ${currentFile}`));
            await this.sendToAi(input);
          }
        } else if (choice === '2') {
          // 重试生成当前文件（仅在检测到完整代码块时显示）
          if (hasCodeBlock && hasFileMarker) {
            console.log(chalk.cyan(`\n重试生成: ${currentFile}`));
            await this.sendToAi(input);
          } else {
            // 跳过当前文件，继续下一个
            console.log(chalk.yellow(`\n跳过文件: ${currentFile}`));
            this.currentGenerationIndex++;
            if (this.currentGenerationIndex < this.generationQueue.length) {
              const nextFile = this.generationQueue[this.currentGenerationIndex];
              console.log(chalk.cyan(`\n准备生成: ${nextFile}`));
              await this.sendToAi(
                `请生成文件: ${nextFile}，模块名: ${this.pendingModuleName}\n\n` +
                `重要提示：\n` +
                `1. 只生成这一个文件，不要生成其他文件\n` +
                `2. 只包含一个代码块\n` +
                `3. 代码块第一行必须是: // FILE: ${nextFile}\n` +
                `4. 不要输出 "## 后端代码" 等标题\n` +
                `5. 不要输出 "接下来生成..." 等预告文字`
              );
            } else {
              console.log(chalk.green('\n✓ 所有文件已生成完毕'));
              this.generationQueue = [];
              this.currentGenerationIndex = -1;
            }
          }
        } else if (choice === '3') {
          // 跳过当前文件，继续下一个（仅在检测到完整代码块时显示）
          if (hasCodeBlock && hasFileMarker) {
            console.log(chalk.yellow(`\n跳过文件: ${currentFile}`));
            this.currentGenerationIndex++;
            if (this.currentGenerationIndex < this.generationQueue.length) {
              const nextFile = this.generationQueue[this.currentGenerationIndex];
              console.log(chalk.cyan(`\n准备生成: ${nextFile}`));
              await this.sendToAi(
                `请生成文件: ${nextFile}，模块名: ${this.pendingModuleName}\n\n` +
                `重要提示：\n` +
                `1. 只生成这一个文件，不要生成其他文件\n` +
                `2. 只包含一个代码块\n` +
                `3. 代码块第一行必须是: // FILE: ${nextFile}\n` +
                `4. 不要输出 "## 后端代码" 等标题\n` +
                `5. 不要输出 "接下来生成..." 等预告文字`
              );
            } else {
              console.log(chalk.green('\n✓ 所有文件已生成完毕'));
              this.generationQueue = [];
              this.currentGenerationIndex = -1;
            }
          } else {
            // 取消生成队列
            console.log(chalk.yellow('\n已取消生成队列'));
            this.generationQueue = [];
            this.currentGenerationIndex = -1;
          }
        } else if (choice === '4' && hasCodeBlock && hasFileMarker) {
          // 取消生成队列（仅在检测到完整代码块时显示）
          console.log(chalk.yellow('\n已取消生成队列'));
          this.generationQueue = [];
          this.currentGenerationIndex = -1;
        }
      }
    }
  }

  /**
   * 新会话
   */
  private async handleNewSession(): Promise<void> {
    console.log(chalk.yellow('\n创建新会话...'));
    await this.createNewSession();
  }

  /**
   * 切换模型
   */
  private async handleModelSwitch(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log(chalk.blue(`\n当前模型: ${this.currentProvider}/${this.currentModel}`));
      
      try {
        const models = await this.aiService.getAvailableModels();
        console.log(chalk.gray('\n可用模型:'));
        models.forEach(p => {
          console.log(chalk.gray(`  ${p.key} - ${p.name}`));
          p.models.forEach(m => {
            const marker = `${p.key}/${m}` === `${this.currentProvider}/${this.currentModel}` ? ' *' : '';
            console.log(chalk.gray(`    - ${m}${marker}`));
          });
        });
      } catch {
        console.log(chalk.gray('  deepseek: deepseek-chat, deepseek-reasoner'));
        console.log(chalk.gray('  openai: gpt-4o, gpt-3.5-turbo'));
      }
      console.log(chalk.gray('\n使用方法: /model <provider>/<model>'));
      return;
    }

    const modelArg = args.join(' ');
    if (modelArg.includes('/')) {
      const [provider, model] = modelArg.split('/');
      this.currentProvider = provider;
      this.currentModel = model;
      console.log(chalk.green(`✓ 已切换到模型: ${provider}/${model}`));
    } else {
      this.currentModel = modelArg;
      console.log(chalk.green(`✓ 已切换到模型: ${this.currentProvider}/${modelArg}`));
    }
  }

  /**
   * 切换提供商
   */
  private async handleProviderSwitch(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log(chalk.blue(`\n当前提供商: ${this.currentProvider}`));
      console.log(chalk.gray('\n可用提供商:'));
      console.log(chalk.gray('  - deepseek'));
      console.log(chalk.gray('  - openai'));
      console.log(chalk.gray('  - qwen'));
      console.log(chalk.gray('  - moonshot'));
      return;
    }

    this.currentProvider = args[0];
    console.log(chalk.green(`✓ 已切换到提供商: ${args[0]}`));
  }

  /**
   * 列出所有会话
   */
  private async handleListSessions(): Promise<void> {
    try {
      const sessions = await this.aiService.listSessions();
      const current = this.aiService.getCurrentSession();

      console.log(chalk.blue('\n会话列表:'));
      if (sessions.length === 0) {
        console.log(chalk.gray('  暂无会话'));
        return;
      }
      
      sessions.forEach(s => {
        const marker = current?.id === s.id ? ' *' : '';
        const date = new Date(s.updatedAt).toLocaleString();
        console.log(chalk.gray(`  [${s.id.slice(0, 8)}] ${s.name} - ${date}${marker}`));
      });
    } catch (error: any) {
      console.log(chalk.red(`获取会话失败: ${error.message}`));
    }
  }

  /**
   * 切换会话
   */
  private async handleSwitchSession(sessionId: string): Promise<void> {
    if (!sessionId) {
      console.log(chalk.red('请提供会话 ID'));
      return;
    }

    const session = await this.aiService.loadSession(sessionId);
    if (session) {
      console.log(chalk.green(`✓ 已切换到会话: ${session.name}`));
    } else {
      console.log(chalk.red('会话不存在'));
    }
  }

  /**
   * 预览代码
   */
  private async handlePreviewCode(): Promise<void> {
    const session = this.aiService.getCurrentSession();
    if (!session || session.messages.length === 0) {
      console.log(chalk.yellow('没有可预览的代码'));
      return;
    }

    // 获取最后一条 AI 回复
    const lastAiMessage = [...session.messages].reverse().find(m => m.role === 'assistant');
    if (!lastAiMessage) {
      console.log(chalk.yellow('没有可预览的代码'));
      return;
    }

    const result = this.codeGenerator!.parseCodeFromResponse(lastAiMessage.content);
    
    console.log(chalk.blue('\n生成的文件:'));
    
    if (result.entity) {
      console.log(chalk.green(`  📄 ${result.entity.path}`));
    }
    if (result.dto) {
      result.dto.forEach(d => console.log(chalk.green(`  📄 ${d.path}`)));
    }
    if (result.service) {
      console.log(chalk.green(`  📄 ${result.service.path}`));
    }
    if (result.controller) {
      console.log(chalk.green(`  📄 ${result.controller.path}`));
    }
    if (result.module) {
      console.log(chalk.green(`  📄 ${result.module.path}`));
    }
    if (result.frontend) {
      if (result.frontend.api) {
        console.log(chalk.green(`  📄 ${result.frontend.api.path}`));
      }
      if (result.frontend.views) {
        result.frontend.views.forEach(v => console.log(chalk.green(`  📄 ${v.path}`)));
      }
    }

    console.log(chalk.yellow('\n使用 /save 保存到项目'));
  }

  /**
   * 保存代码
   */
  private async handleSaveCode(): Promise<void> {
    const session = this.aiService.getCurrentSession();
    if (!session || session.messages.length === 0) {
      console.log(chalk.yellow('没有可保存的代码'));
      return;
    }

    // 获取最后一条 AI 回复
    const lastAiMessage = [...session.messages].reverse().find(m => m.role === 'assistant');
    if (!lastAiMessage) {
      console.log(chalk.yellow('没有可保存的代码'));
      return;
    }

    const result = this.codeGenerator!.parseCodeFromResponse(lastAiMessage.content);
    
    // 记录解析结果
    await this.logger.debug('PARSE_CODE_RESULT', {
      hasEntity: !!result.entity,
      hasService: !!result.service,
      hasController: !!result.controller,
      hasModule: !!result.module,
      dtoCount: result.dto?.length || 0,
    });
    
    // 检查是否有可保存的文件
    const filesToSave: string[] = [];
    if (result.entity) filesToSave.push(result.entity.path);
    if (result.dto) result.dto.forEach(d => filesToSave.push(d.path));
    if (result.service) filesToSave.push(result.service.path);
    if (result.controller) filesToSave.push(result.controller.path);
    if (result.module) filesToSave.push(result.module.path);
    if (result.frontend?.api) filesToSave.push(result.frontend.api.path);
    if (result.frontend?.views) result.frontend.views.forEach(v => filesToSave.push(v.path));

    if (filesToSave.length === 0) {
      console.log(chalk.yellow('没有需要保存的文件'));
      await this.logger.warn('SAVE_NO_FILES_FOUND');
      return;
    }

    console.log(chalk.blue('\n保存文件:'));
    filesToSave.forEach(f => console.log(chalk.gray(`  ${f}`)));

    // 保存文件
    const spinner = ora('正在保存...').start();
    try {
      const saved = await this.codeGenerator!.writeFiles(result, false);
      spinner.succeed(`已保存 ${saved.length} 个文件`);
      
      // 记录保存的文件
      for (const file of saved) {
        await this.logger.logFileSaved(file);
      }

      // 更新 app.module.ts
      if (result.module) {
        const moduleName = result.module.path.split('/').slice(-2)[0];
        await this.codeGenerator!.updateAppModule(moduleName);
        console.log(chalk.green(`✓ 已更新 app.module.ts`));
      }

      // 检查是否还有下一个文件要生成
      this.currentGenerationIndex++;
      if (this.currentGenerationIndex < this.generationQueue.length) {
        const nextFile = this.generationQueue[this.currentGenerationIndex];
        console.log(chalk.cyan(`\n准备生成: ${nextFile}`));
        // 发送消息给 AI 要求生成下一个文件（明确指定单文件模式）
        await this.sendToAi(
          `请生成文件: ${nextFile}，模块名: ${this.pendingModuleName}\n\n` +
          `重要提示：\n` +
          `1. 只生成这一个文件，不要生成其他文件\n` +
          `2. 只包含一个代码块\n` +
          `3. 代码块第一行必须是: // FILE: ${nextFile}\n` +
          `4. 不要输出 "## 后端代码" 等标题\n` +
          `5. 不要输出 "接下来生成..." 等预告文字`
        );
      } else if (this.generationQueue.length > 0) {
        // 全部生成完成，更新 app.module.ts
        console.log(chalk.cyan('\n更新 app.module.ts...'));
        try {
          await this.codeGenerator!.updateAppModule(this.pendingModuleName);
          console.log(chalk.green('✓ 已更新 app.module.ts'));
        } catch (e) {
          console.log(chalk.yellow('! 更新 app.module.ts 失败，请手动添加'));
        }
        
        // 全部生成完成
        console.log(chalk.green('\n✓ 所有文件已生成完毕'));
        await this.logger.logGenerationComplete();
        this.generationQueue = [];
        this.currentGenerationIndex = -1;
        
        // 显示菜单配置
        if (session.metadata?.entityName) {
          const menuConfig = this.codeGenerator!.generateMenuConfig(
            session.metadata.moduleName || session.metadata.entityName.toLowerCase(),
            session.metadata.entityName,
            session.metadata.features || ['list', 'create', 'update', 'delete']
          );
          console.log(chalk.blue('\n菜单配置（请手动添加到数据库）:'));
          console.log(chalk.gray(JSON.stringify(menuConfig, null, 2)));
        }
      }
    } catch (error: any) {
      spinner.fail(`保存失败: ${error.message}`);
      await this.logger.error('SAVE_FILES_FAILED', { error: error.message });
    }
  }

  /**
   * 显示状态
   */
  private async showStatus(): Promise<void> {
    const session = this.aiService.getCurrentSession();
    console.log(chalk.blue('\n当前状态:'));
    console.log(chalk.gray(`  提供商: ${this.currentProvider}`));
    console.log(chalk.gray(`  模型: ${this.currentModel}`));
    console.log(chalk.gray(`  日志文件: ${this.logger.getLogFilePath()}`));
    if (session) {
      console.log(chalk.gray(`  会话: ${session.name}`));
      console.log(chalk.gray(`  消息数: ${session.messages.length}`));
    } else {
      console.log(chalk.gray(`  会话: 无`));
    }
    
    // 显示生成队列状态
    if (this.generationQueue.length > 0) {
      console.log(chalk.gray(`  生成队列: ${this.currentGenerationIndex + 1}/${this.generationQueue.length}`));
      console.log(chalk.gray(`  当前文件: ${this.generationQueue[this.currentGenerationIndex] || '已完成'}`));
    }
  }

  /**
   * 显示日志
   */
  private async handleShowLogs(): Promise<void> {
    console.log(chalk.blue('\n日志文件:'));
    console.log(chalk.gray(`当前日志: ${this.logger.getLogFilePath()}`));
    
    const logs = await this.logger.listLogs();
    if (logs.length === 0) {
      console.log(chalk.gray('暂无历史日志'));
      return;
    }
    
    console.log(chalk.gray('\n历史日志（最近10条）:'));
    logs.slice(0, 10).forEach((log, i) => {
      const size = (log.size / 1024).toFixed(1);
      console.log(chalk.gray(`  ${i + 1}. ${log.file} (${size} KB) - ${log.date.toLocaleString()}`));
    });
  }

  /**
   * 显示帮助
   */
  private showHelp(): void {
    console.log(chalk.blue('\n可用命令:'));
    console.log(chalk.gray('  /new          - 创建新会话'));
    console.log(chalk.gray('  /model        - 切换 AI 模型'));
    console.log(chalk.gray('  /provider     - 切换 AI 提供商'));
    console.log(chalk.gray('  /sessions     - 列出所有会话'));
    console.log(chalk.gray('  /switch <id>  - 切换到指定会话'));
    console.log(chalk.gray('  /preview      - 预览最后生成的代码'));
    console.log(chalk.gray('  /save         - 保存当前文件并继续下一个'));
    console.log(chalk.gray('  /status       - 显示当前状态'));
    console.log(chalk.gray('  /logs         - 查看日志文件'));
    console.log(chalk.gray('  /clear        - 清屏'));
    console.log(chalk.gray('  /exit, /quit  - 退出'));
    console.log(chalk.gray('  /help         - 显示帮助'));
    console.log();
    console.log(chalk.cyan('使用流程（单文件生成模式）:'));
    console.log(chalk.gray('  1. 选择模块类型 → 2. 确定实体名称 → 3. 设计字段'));
    console.log(chalk.gray('  4. 选择功能 → 5. 确认文件列表'));
    console.log(chalk.gray('  6. 输入"确认"开始生成第一个文件'));
    console.log(chalk.gray('  7. AI 生成单个文件 → 8. 输入 /save 保存'));
    console.log(chalk.gray('  9. 系统自动生成下一个文件 → 10. 重复 8-9 直到完成'));
    console.log();
    console.log(chalk.yellow('提示: 每次只生成一个文件，保存后自动继续下一个'));
    console.log();
  }
}
