#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { InteractiveCommand } from './commands/interactive';

const packageJson = fs.readJsonSync(path.join(__dirname, '..', 'package.json'));

const program = new Command();

program
  .name('zayum')
  .description('Zayum CLI - AI-powered code generator')
  .version(packageJson.version);

// AI 交互模式
program
  .command('ai')
  .description('启动 AI 交互式代码生成器')
  .option('-p, --provider <provider>', '指定 AI 提供商', 'deepseek')
  .option('-m, --model <model>', '指定模型', 'deepseek-chat')
  .allowUnknownOption()
  .action(async (options) => {
    try {
      const cmd = new InteractiveCommand();
      await cmd.start();
    } catch (error: any) {
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

// 快速生成 CRUD
program
  .command('generate <name>')
  .alias('g')
  .description('快速生成 CRUD 代码')
  .option('-f, --features <features>', '功能列表 (comma separated)', 'list,create,update,delete')
  .option('--dry-run', '预览模式，不实际写入文件')
  .action(async (name, options) => {
    console.log(chalk.blue(`正在生成 ${name} 的 CRUD 代码...`));
    console.log(chalk.gray(`功能: ${options.features}`));
    console.log(chalk.yellow('请使用 zayum ai 命令启动交互式生成器以获得更好体验'));
  });

// 生成菜单
program
  .command('menu')
  .description('生成后端菜单配置')
  .action(async () => {
    console.log(chalk.blue('生成菜单配置...'));
  });

// 项目分析
program
  .command('analyze')
  .description('分析项目结构')
  .action(async () => {
    const { ProjectAnalyzer } = await import('./utils/project-analyzer');
    const analyzer = new ProjectAnalyzer();
    const structure = await analyzer.analyze();
    console.log(analyzer.generateStructureDescription(structure));
  });

// 配置管理
program
  .command('config')
  .description('管理 CLI 配置')
  .option('-s, --set <key=value>', '设置配置项')
  .option('-g, --get <key>', '获取配置项')
  .option('-l, --list', '列出所有配置')
  .action(async (options) => {
    const configPath = path.join(require('os').homedir(), '.zayum-cli', 'config.json');
    await fs.ensureDir(path.dirname(configPath));

    if (options.set) {
      const [key, value] = options.set.split('=');
      let config: Record<string, string> = {};
      if (await fs.pathExists(configPath)) {
        config = await fs.readJson(configPath);
      }
      config[key] = value;
      await fs.writeJson(configPath, config, { spaces: 2 });
      console.log(chalk.green(`✓ 已设置 ${key}=${value}`));
    } else if (options.get) {
      if (await fs.pathExists(configPath)) {
        const config: Record<string, string> = await fs.readJson(configPath);
        console.log(config[options.get] || '');
      }
    } else if (options.list) {
      if (await fs.pathExists(configPath)) {
        const config: Record<string, string> = await fs.readJson(configPath);
        console.log(chalk.blue('当前配置:'));
        Object.entries(config).forEach(([k, v]) => {
          console.log(chalk.gray(`  ${k}: ${v}`));
        });
      } else {
        console.log(chalk.yellow('暂无配置'));
      }
    }
  });

program.parse();
