import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getApiClient, initApiClient } from '../utils/api-client';

export const pluginUpdateCommand = new Command('plugin:update')
  .description('Update a plugin to the latest version')
  .argument('<name>', 'Plugin name')
  .option('--version <version>', 'Target version (default: latest)')
  .option('--market-url <url>', 'Plugin market URL')
  .option('--api-url <url>', 'API base URL', 'http://localhost:3000')
  .option('--token <token>', 'API authentication token')
  .action(async (name, options) => {
    const spinner = ora();
    
    try {
      initApiClient(options.apiUrl, options.token);
      const api = getApiClient();

      // 检查更新
      spinner.start('Checking for updates...');
      const updateInfo = await api.checkUpdate(name, options.marketUrl);
      spinner.stop();

      if (!updateInfo.hasUpdate && !options.version) {
        console.log(chalk.green(`✅ Plugin ${name} is already up to date (${updateInfo.currentVersion})`));
        return;
      }

      const targetVersion = options.version || updateInfo.latestVersion;
      
      if (!options.version && updateInfo.hasUpdate) {
        console.log(chalk.blue(`📦 New version available: ${updateInfo.currentVersion} → ${updateInfo.latestVersion}`));
      }

      // 执行更新
      spinner.start(`Updating ${name} to ${targetVersion}...`);
      const updated = await api.updatePlugin(name, options.version, options.marketUrl);
      spinner.succeed('Plugin updated successfully');

      console.log();
      console.log(chalk.green('✅ Update completed!'));
      console.log(chalk.gray(`   Name: ${updated.displayName}`));
      console.log(chalk.gray(`   Version: ${updated.version}`));

    } catch (error: any) {
      spinner.fail('Update failed');
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });
