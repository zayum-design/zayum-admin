import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getApiClient, initApiClient } from '../utils/api-client';
import { getConfigManager } from '../utils/config-manager';

export const pluginSearchCommand = new Command('plugin:search')
  .description('Search plugins from market')
  .argument('<keyword>', 'Search keyword')
  .option('--source <name>', 'Plugin source to search')
  .option('--api-url <url>', 'API base URL', 'http://localhost:3000')
  .option('--token <token>', 'API authentication token')
  .action(async (keyword, options) => {
    const spinner = ora();
    
    try {
      initApiClient(options.apiUrl, options.token);
      const api = getApiClient();
      const config = getConfigManager();

      spinner.start(`Searching plugins for "${keyword}"...`);

      let results;
      if (options.source) {
        // 搜索指定源
        const source = config.getSource(options.source);
        if (!source) {
          throw new Error(`Source ${options.source} not found`);
        }
        if (!source.enabled) {
          throw new Error(`Source ${options.source} is disabled`);
        }
        results = await api.searchSource(source, keyword);
      } else {
        // 搜索默认源
        const defaultSource = config.getDefaultSource();
        results = await api.searchMarket(keyword, defaultSource.url);
      }

      spinner.stop();

      if (results.length === 0) {
        console.log(chalk.yellow(`No plugins found for "${keyword}"`));
        return;
      }

      console.log(chalk.blue(`\n🔍 Found ${results.length} plugins:`));
      console.log();

      results.forEach((plugin, index) => {
        console.log(`  ${index + 1}. ${chalk.bold(plugin.displayName)} ${chalk.gray(`(${plugin.name})`)}`);
        console.log(`     Version: ${chalk.cyan(plugin.version)}`);
        console.log(`     Author: ${chalk.gray(plugin.author || 'Unknown')}`);
        console.log(`     Downloads: ${chalk.gray(plugin.downloads || 0)}`);
        if (plugin.description) {
          console.log(`     ${chalk.gray(plugin.description.substring(0, 100))}${plugin.description.length > 100 ? '...' : ''}`);
        }
        console.log();
      });

      console.log(chalk.gray('Use `zayum plugin:install <name>` to install a plugin'));

    } catch (error: any) {
      spinner.fail('Search failed');
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });
