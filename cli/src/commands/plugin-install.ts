import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import * as fs from 'fs-extra';
import { getApiClient, initApiClient } from '../utils/api-client';
import { getConfigManager } from '../utils/config-manager';
import { PluginValidator } from '../utils/plugin-validator';
import { ensurePluginsDir, getPluginPath, copyPlugin } from '../utils/file-utils';

export const pluginInstallCommand = new Command('plugin:install')
  .description('Install a plugin from market, URL, or local directory')
  .argument('<source>', 'Plugin name, URL, or local path')
  .option('--version <version>', 'Specific version to install')
  .option('--url', 'Treat source as URL')
  .option('--local', 'Treat source as local path')
  .option('--source <name>', 'Plugin source/market to use')
  .option('--enable', 'Enable plugin after installation')
  .option('--api-url <url>', 'API base URL', 'http://localhost:3000')
  .option('--token <token>', 'API authentication token')
  .action(async (source, options) => {
    const spinner = ora();
    
    try {
      initApiClient(options.apiUrl, options.token);
      const api = getApiClient();
      const config = getConfigManager();

      // 判断安装来源
      let installMethod: 'market' | 'url' | 'local';
      
      if (options.url) {
        installMethod = 'url';
      } else if (options.local) {
        installMethod = 'local';
      } else if (source.startsWith('http://') || source.startsWith('https://')) {
        installMethod = 'url';
      } else if (await fs.pathExists(source)) {
        installMethod = 'local';
      } else {
        installMethod = 'market';
      }

      let plugin;

      switch (installMethod) {
        case 'market': {
          // 从市场安装
          spinner.start(`Installing ${source} from market...`);
          
          const marketUrl = options.source 
            ? config.getSource(options.source)?.url 
            : undefined;
          
          plugin = await api.installFromMarket(
            source,
            options.version,
            marketUrl,
            options.enable,
          );
          
          spinner.succeed(`Plugin ${source} installed from market`);
          break;
        }

        case 'url': {
          // 从 URL 安装
          spinner.start(`Downloading plugin from ${source}...`);
          
          plugin = await api.installFromUrl(source, options.enable);
          
          spinner.succeed('Plugin downloaded and installed');
          break;
        }

        case 'local': {
          // 本地安装
          spinner.start('Validating plugin...');
          const manifest = await PluginValidator.validate(source);
          spinner.succeed(`Plugin validated: ${manifest.displayName} v${manifest.version}`);

          // 复制到插件目录
          spinner.start('Installing plugin files...');
          await ensurePluginsDir();
          const destPath = getPluginPath(manifest.name);
          await copyPlugin(source, destPath);
          spinner.succeed('Plugin files installed');

          // 注册插件
          spinner.start('Registering plugin...');
          plugin = await api.installPlugin(destPath);
          spinner.succeed('Plugin registered successfully');

          // 自动启用
          if (options.enable) {
            spinner.start('Enabling plugin...');
            await api.enablePlugin(plugin.name);
            spinner.succeed('Plugin enabled');
          }
          break;
        }
      }

      console.log();
      console.log(chalk.green('✅ Plugin installed successfully!'));
      console.log(chalk.gray(`   Name: ${plugin.displayName}`));
      console.log(chalk.gray(`   Version: ${plugin.version}`));
      console.log(chalk.gray(`   Status: ${plugin.status}`));

      if (!options.enable && installMethod !== 'local') {
        console.log();
        console.log(chalk.yellow('Tip:'), `Run 'zayum plugin:enable ${plugin.name}' to enable the plugin`);
      }

    } catch (error: any) {
      spinner.fail('Installation failed');
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });
