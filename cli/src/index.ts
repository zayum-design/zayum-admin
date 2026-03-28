#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

// 导入命令
import { pluginListCommand } from './commands/plugin-list';
import { pluginInstallCommand } from './commands/plugin-install';
import { pluginUninstallCommand } from './commands/plugin-uninstall';
import { pluginEnableCommand } from './commands/plugin-enable';
import { pluginDisableCommand } from './commands/plugin-disable';
import { pluginSearchCommand } from './commands/plugin-search';
import { pluginUpdateCommand } from './commands/plugin-update';
import { sourceCommand } from './commands/plugin-source';

const program = new Command();

program
  .name('zayum')
  .description('Zayum Admin CLI - Plugin management tool')
  .version('1.0.0');

// 注册插件管理命令
program.addCommand(pluginListCommand);
program.addCommand(pluginInstallCommand);
program.addCommand(pluginUninstallCommand);
program.addCommand(pluginEnableCommand);
program.addCommand(pluginDisableCommand);
program.addCommand(pluginSearchCommand);
program.addCommand(pluginUpdateCommand);

// 注册源管理命令
program.addCommand(sourceCommand);

// 错误处理
program.exitOverride();

try {
  program.parse();
} catch (error: any) {
  if (error.code !== 'commander.helpDisplayed' && error.code !== 'commander.version') {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
  }
}
