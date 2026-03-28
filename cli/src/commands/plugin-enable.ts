import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getApiClient, initApiClient } from '../utils/api-client';

export const pluginEnableCommand = new Command('plugin:enable')
  .description('Enable a plugin')
  .argument('<name>', 'Plugin name')
  .option('--api-url <url>', 'API base URL', 'http://localhost:3000')
  .option('--token <token>', 'API authentication token')
  .action(async (name, options) => {
    const spinner = ora();
    
    try {
      initApiClient(options.apiUrl, options.token);
      const api = getApiClient();

      spinner.start(`Enabling plugin ${name}...`);
      await api.enablePlugin(name);
      spinner.succeed('Plugin enabled');

      console.log(chalk.green(`✅ Plugin ${name} is now enabled`));

    } catch (error: any) {
      spinner.fail('Failed to enable plugin');
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });
