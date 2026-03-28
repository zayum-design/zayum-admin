import { Command } from 'commander';
import chalk from 'chalk';
import { getConfigManager, PluginSource } from '../utils/config-manager';

const sourceCommand = new Command('source')
  .description('Manage plugin sources');

// 列出源
sourceCommand
  .command('list')
  .description('List all plugin sources')
  .action(() => {
    const config = getConfigManager();
    const sources = config.getAllSources();

    if (sources.length === 0) {
      console.log(chalk.yellow('No plugin sources configured'));
      return;
    }

    console.log(chalk.blue('\n📦 Plugin Sources:'));
    console.log();

    sources.forEach(source => {
      const isDefault = source.isDefault ? chalk.green(' [default]') : '';
      const status = source.enabled ? chalk.green('●') : chalk.gray('○');
      console.log(`  ${status} ${chalk.bold(source.name)}${isDefault}`);
      console.log(`     URL: ${chalk.gray(source.url)}`);
      if (source.token) {
        console.log(`     Token: ${chalk.gray('********')}`);
      }
      console.log();
    });
  });

// 添加源
sourceCommand
  .command('add')
  .description('Add a plugin source')
  .argument('<name>', 'Source name')
  .argument('<url>', 'Source URL')
  .option('--token <token>', 'Authentication token')
  .action(async (name, url, options) => {
    try {
      const config = getConfigManager();
      
      const source: PluginSource = {
        name,
        url,
        token: options.token,
        enabled: true,
      };

      await config.addSource(source);
      console.log(chalk.green(`✅ Source "${name}" added successfully`));
    } catch (error: any) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// 删除源
sourceCommand
  .command('remove')
  .description('Remove a plugin source')
  .argument('<name>', 'Source name')
  .action(async (name) => {
    try {
      const config = getConfigManager();
      await config.removeSource(name);
      console.log(chalk.green(`✅ Source "${name}" removed successfully`));
    } catch (error: any) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// 设置默认源
sourceCommand
  .command('default')
  .description('Set default plugin source')
  .argument('<name>', 'Source name')
  .action(async (name) => {
    try {
      const config = getConfigManager();
      await config.setDefaultSource(name);
      console.log(chalk.green(`✅ "${name}" is now the default source`));
    } catch (error: any) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// 启用源
sourceCommand
  .command('enable')
  .description('Enable a plugin source')
  .argument('<name>', 'Source name')
  .action(async (name) => {
    try {
      const config = getConfigManager();
      await config.enableSource(name);
      console.log(chalk.green(`✅ Source "${name}" enabled`));
    } catch (error: any) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// 禁用源
sourceCommand
  .command('disable')
  .description('Disable a plugin source')
  .argument('<name>', 'Source name')
  .action(async (name) => {
    try {
      const config = getConfigManager();
      await config.disableSource(name);
      console.log(chalk.yellow(`⚠️  Source "${name}" disabled`));
    } catch (error: any) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

export { sourceCommand };
