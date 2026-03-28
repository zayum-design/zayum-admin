import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getApiClient, initApiClient } from '../utils/api-client';

export const pluginDisableCommand = new Command('plugin:disable')
  .description('Disable a plugin')
  .argument('<name>', 'Plugin name')
  .option('--api-url <url>', 'API base URL', 'http://localhost:3000')
  .option('--token <token>', 'API authentication token')
  .action(async (name, options) => {
    const spinner = ora();
    
    try {
      initApiClient(options.apiUrl, options.token);
      const api = getApiClient();

      spinner.start(`Disabling plugin ${name}...`);
      await api.disablePlugin(name);
      spinner.succeed('Plugin disabled');

      console.log(chalk.yellow(`⚠️  Plugin ${name} is now disabled`));

    } catch (error: any) {
      spinner.fail('Failed to disable plugin');
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });
