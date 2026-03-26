import chalk from 'chalk';
import ora from 'ora';
import { AiService, Session } from '../services/ai-service';
import { CodeGenerator, CodeGenerationResult } from '../services/code-generator';
import { ProjectAnalyzer, ProjectStructure } from '../utils/project-analyzer';
import { prompt } from '../utils/prompt';

export class InteractiveCommand {
  private aiService: AiService;
  private projectAnalyzer: ProjectAnalyzer;
  private projectStructure: ProjectStructure | null = null;
  private codeGenerator: CodeGenerator | null = null;
  private currentProvider: string = 'deepseek';
  private currentModel: string = 'deepseek-chat';
  private running: boolean = false;

  constructor() {
    this.aiService = new AiService();
    this.projectAnalyzer = new ProjectAnalyzer();
  }

  /**
   * 启动交互式 CLI
   */
  async start(): Promise<void> {
    console.log(chalk.cyan.bold('\n🚀 Zayum CLI - AI 代码生成器\n'));

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

    // 显示帮助信息
    this.showHelp();

    // 开始交互循环
    this.running = true;
    await this.interactiveLoop();
  }

  /**
   * 创建新会话
   */
  private async createNewSession(): Promise<void> {
    const systemPrompt = this.generateSystemPrompt();
    const session = await this.aiService.createSession(
      `会话 ${new Date().toLocaleString()}`,
      systemPrompt
    );
    console.log(chalk.green(`\n✓ 已创建新会话: ${session.id.slice(0, 8)}...`));
  }

  /**
   * 生成系统提示词
   */
  private generateSystemPrompt(): string {
    const lines: string[] = [];
    
    lines.push('你是一个专业的全栈开发助手，采用问答式交互帮助用户逐步完成模块构建。');
    lines.push('');
    lines.push('## 项目结构');
    lines.push(this.projectAnalyzer.generateStructureDescription(this.projectStructure!));
    lines.push('');
    lines.push('## 交互原则');
    lines.push('1. 每次只问一个问题，提供 2-4 个明确的选项');
    lines.push('2. 等待用户选择后再进入下一步');
    lines.push('3. 回复要简洁，不要一次性输出过多内容');
    lines.push('4. 不要假设用户的答案，必须让用户明确选择');
    lines.push('');
    lines.push('## 构建流程（按顺序执行）');
    lines.push('');
    lines.push('### 步骤1: 选择模块类型');
    lines.push('询问用户要创建什么类型的模块，提供选项:');
    lines.push('- 用户管理模块');
    lines.push('- 内容管理模块');
    lines.push('- 订单/交易模块');
    lines.push('- 自定义模块（让用户输入名称）');
    lines.push('');
    lines.push('### 步骤2: 确定实体名称');
    lines.push('根据选择的类型，建议一个实体名称，询问是否确认或修改');
    lines.push('');
    lines.push('### 步骤3: 设计数据字段');
    lines.push('分轮次询问字段:');
    lines.push('- 先问:"需要哪些基础字段？" 提供选项: 名称、状态、创建时间、更新时间、备注等');
    lines.push('- 再问:"需要添加业务字段吗？" 让用户输入或选择跳过');
    lines.push('- 确认字段列表，询问是否需要修改');
    lines.push('');
    lines.push('### 步骤4: 确定功能需求');
    lines.push('提供功能选项让用户选择（可多选）:');
    lines.push('- A. 增删改查（基础CRUD）');
    lines.push('- B. 分页列表');
    lines.push('- C. 搜索过滤');
    lines.push('- D. 批量操作');
    lines.push('- E. 数据导入导出');
    lines.push('- F. 权限控制');
    lines.push('');
    lines.push('### 步骤5: 确认生成');
    lines.push('汇总信息，询问:"确认生成以下代码吗？"');
    lines.push('- Entity');
    lines.push('- DTO（Create/Update/Query）');
    lines.push('- Service');
    lines.push('- Controller');
    lines.push('- Module');
    lines.push('- 前端API和页面（可选）');
    lines.push('');
    lines.push('### 步骤6: 生成代码');
    lines.push('用户确认后，输出完整代码');
    lines.push('');
    lines.push('## 回复格式');
    lines.push('```');
    lines.push('简短的引导语...');
    lines.push('');
    lines.push('请选择:');
    lines.push('  [1] 选项一');
    lines.push('  [2] 选项二');
    lines.push('  [3] 选项三');
    lines.push('  [0] 其他（请描述）');
    lines.push('```');
    lines.push('');
    lines.push('## 代码规范');
    lines.push('- 后端: NestJS + TypeORM');
    lines.push('- 实体: sys-{name}.entity.ts');
    lines.push('- DTO: 使用 class-validator');
    lines.push('- API: RESTful 风格');
    lines.push('');
    lines.push('## 现在开始');
    lines.push('请用一句话问候用户，然后询问他们想创建什么模块，提供选项供选择。');

    return lines.join('\n');
  }

  /**
   * 交互循环
   */
  private async interactiveLoop(): Promise<void> {
    while (this.running) {
      try {
        const input = await prompt(chalk.blue('> '));
        
        if (!input || !input.trim()) continue;

        // 处理命令
        if (input.startsWith('/')) {
          const shouldContinue = await this.handleCommand(input);
          if (!shouldContinue) {
            this.running = false;
            break;
          }
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
   * 处理命令
   */
  private async handleCommand(input: string): Promise<boolean> {
    const parts = input.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

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
        this.showStatus();
        break;

      case '/clear':
        console.clear();
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
    
    try {
      let fullResponse = '';
      
      // 使用流式输出
      for await (const chunk of this.aiService.chatStream(input, {
        provider: this.currentProvider,
        model: this.currentModel,
      })) {
        process.stdout.write(chunk);
        fullResponse += chunk;
      }
      
      console.log(); // 换行
      
      // 检查是否包含代码
      if (fullResponse.includes('```')) {
        console.log(chalk.yellow('\n💡 提示: 使用 /preview 预览代码，/save 保存代码到项目'));
      }
    } catch (error: any) {
      console.log(chalk.red(`请求失败: ${error.message}`));
    }
  }

  /**
   * 新会话
   */
  private async handleNewSession(): Promise<void> {
    console.log(chalk.yellow('\n创建新会话...'));
    await this.createNewSession();
    console.log(chalk.green('✓ 新会话已创建\n'));
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
    
    // 先预览
    console.log(chalk.blue('\n即将保存的文件:'));
    const written = await this.codeGenerator!.writeFiles(result, true);
    written.forEach(f => console.log(chalk.gray(`  ${f}`)));

    if (written.length === 0) {
      console.log(chalk.yellow('没有需要保存的文件'));
      return;
    }

    // 确认
    const confirm = await prompt(chalk.yellow('\n确认保存? (y/n): '));
    if (confirm.toLowerCase() !== 'y') {
      console.log(chalk.yellow('已取消'));
      return;
    }

    // 保存文件
    const spinner = ora('正在保存文件...').start();
    try {
      const saved = await this.codeGenerator!.writeFiles(result, false);
      spinner.succeed(`已保存 ${saved.length} 个文件`);

      // 更新 app.module.ts
      if (result.module) {
        const moduleName = result.module.path.split('/').slice(-2)[0];
        await this.codeGenerator!.updateAppModule(moduleName);
        console.log(chalk.green(`✓ 已更新 app.module.ts`));
      }

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
    } catch (error: any) {
      spinner.fail(`保存失败: ${error.message}`);
    }
  }

  /**
   * 显示状态
   */
  private showStatus(): void {
    const session = this.aiService.getCurrentSession();
    console.log(chalk.blue('\n当前状态:'));
    console.log(chalk.gray(`  提供商: ${this.currentProvider}`));
    console.log(chalk.gray(`  模型: ${this.currentModel}`));
    if (session) {
      console.log(chalk.gray(`  会话: ${session.name}`));
      console.log(chalk.gray(`  消息数: ${session.messages.length}`));
    } else {
      console.log(chalk.gray(`  会话: 无`));
    }
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
    console.log(chalk.gray('  /save         - 保存代码到项目'));
    console.log(chalk.gray('  /status       - 显示当前状态'));
    console.log(chalk.gray('  /clear        - 清屏'));
    console.log(chalk.gray('  /exit, /quit  - 退出'));
    console.log(chalk.gray('  /help         - 显示帮助'));
    console.log();
  }
}
