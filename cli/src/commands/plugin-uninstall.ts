import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { getApiClient, initApiClient } from '../utils/api-client';
import { removePlugin } from '../utils/file-utils';

export const pluginUninstallCommand = new Command('plugin:uninstall')
  .description('Uninstall a plugin')
  .argument('<name>', 'Plugin name')
  .option('-y, --yes', 'Skip confirmation')
  .option('--api-url <url>', 'API base URL', 'http://localhost:3000')
  .option('--token <token>', 'API authentication token')
  .action(async (name, options) => {
    const spinner = ora();
    
    try {
      initApiClient(options.apiUrl, options.token);
      const api = getApiClient();

      const plugins = await api.getPlugins();
      const plugin = plugins.find(p => p.name === name);
      
      if (!plugin) {
        throw new Error(`Plugin ${name} is not installed`);
      }

      if (!options.yes) {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to uninstall ${plugin.displayName}?`,
          default: false,
        }]);

        if (!confirm) {
          console.log(chalk.yellow('Uninstall cancelled'));
          return;
        }
      }

      spinner.start(`Uninstalling ${plugin.displayName}...`);
      await api.uninstallPlugin(name);
      spinner.succeed('Plugin unregistered');

      spinner.start('Removing plugin files...');
      await removePlugin(name);
      spinner.succeed('Plugin files removed');

      console.log();
      console.log(chalk.green('✅ Plugin uninstalled successfully!'));

    } catch (error: any) {
      spinner.fail('Uninstall failed');
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });
