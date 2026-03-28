import { Command } from 'commander';
import chalk from 'chalk';
import { getApiClient } from '../utils/api-client';
import { listLocalPlugins } from '../utils/file-utils';

export const pluginListCommand = new Command('plugin:list')
  .description('List all plugins')
  .option('-i, --installed', 'Show only installed plugins')
  .option('-l, --local', 'Show only local plugins (not installed)')
  .option('-e, --enabled', 'Show only enabled plugins')
  .action(async (options) => {
    try {
      const api = getApiClient();

      if (options.local) {
        const localPlugins = await listLocalPlugins();
        console.log(chalk.blue('📦 Local Plugins:'));
        if (localPlugins.length === 0) {
          console.log(chalk.gray('  No local plugins found'));
        } else {
          localPlugins.forEach(name => {
            console.log(`  • ${chalk.green(name)}`);
          });
        }
        return;
      }

      const plugins = options.enabled 
        ? await api.getEnabledPlugins()
        : await api.getPlugins();

      if (plugins.length === 0) {
        console.log(chalk.yellow('No plugins found'));
        return;
      }

      console.log(chalk.blue(`📦 ${options.enabled ? 'Enabled' : 'Installed'} Plugins:`));
      console.log();

      plugins.forEach(plugin => {
        const statusColor = {
          installed: chalk.yellow,
          enabled: chalk.green,
          disabled: chalk.gray,
          error: chalk.red,
        }[plugin.status];

        console.log(`  ${chalk.bold(plugin.displayName)} ${chalk.gray(`(${plugin.name})`)}`);
        console.log(`    Version: ${chalk.cyan(plugin.version)}`);
        console.log(`    Status: ${statusColor(plugin.status)}`);
        if (plugin.description) {
          console.log(`    Description: ${chalk.gray(plugin.description)}`);
        }
        console.log();
      });

    } catch (error: any) {
      console.error(chalk.red('❌ Failed to list plugins:'), error.message);
      process.exit(1);
    }
  });
