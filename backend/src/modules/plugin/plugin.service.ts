import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysPlugin } from '../../entities/sys-plugin.entity';
import { PluginLoader } from './plugin.loader';
import { PluginRegistry } from './plugin.registry';
import { PluginDownloader, PluginPackageInfo } from './plugin.downloader';
import { MenuInjector } from './menu.injector';
import { PluginManifest, MenuConfig } from './interfaces';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PluginService {
  private readonly logger = new Logger(PluginService.name);
  private readonly pluginsDir: string;
  private readonly defaultMarketUrl: string;

  constructor(
    @InjectRepository(SysPlugin)
    private pluginRepo: Repository<SysPlugin>,
    private pluginLoader: PluginLoader,
    private pluginDownloader: PluginDownloader,
    private registry: PluginRegistry,
    private menuInjector: MenuInjector,
  ) {
    this.pluginsDir = path.join(process.cwd(), 'plugins');
    this.defaultMarketUrl = process.env.PLUGIN_MARKET_URL || 'https://market.zayum.com';
  }

  /**
   * 从本地路径安装插件
   */
  async install(pluginPath: string): Promise<SysPlugin> {
    // 1. 验证 plugin.json
    const manifest = this.readManifest(pluginPath);
    
    // 2. 检查是否已安装
    const existing = await this.pluginRepo.findOne({
      where: { name: manifest.name },
    });
    if (existing) {
      throw new BadRequestException(`Plugin ${manifest.name} is already installed`);
    }

    // 3. 执行数据库迁移
    if (manifest.database?.migrations) {
      await this.pluginLoader.executeMigrations(pluginPath, manifest.database.migrations);
    }

    // 4. 创建插件记录
    const plugin = this.pluginRepo.create({
      name: manifest.name,
      displayName: manifest.displayName,
      version: manifest.version,
      description: manifest.description,
      status: 'installed',
      config: {},
      manifest: manifest as any,
      hasMigrations: !!manifest.database?.migrations?.length,
    });
    await this.pluginRepo.save(plugin);

    // 5. 注入菜单
    if (manifest.frontend?.menu && Array.isArray(manifest.frontend.menu)) {
      await this.menuInjector.injectMenus(plugin.id, manifest.frontend.menu);
    }

    this.logger.log(`Plugin ${manifest.name} installed successfully`);
    return plugin;
  }

  /**
   * 从 URL 安装插件
   */
  async installFromUrl(
    url: string,
    hash?: string,
    hashAlgorithm?: string,
    autoEnable = false,
  ): Promise<SysPlugin> {
    this.logger.log(`Installing plugin from URL: ${url}`);

    // 1. 下载插件
    const { pluginPath, manifest, tempDir } = await this.pluginDownloader.downloadFromUrl(
      url,
      hash,
      hashAlgorithm,
    );

    try {
      // 2. 检查是否已安装
      const existing = await this.pluginRepo.findOne({
        where: { name: manifest.name },
      });
      if (existing) {
        throw new BadRequestException(`Plugin ${manifest.name} is already installed`);
      }

      // 3. 执行安装
      const plugin = await this.install(pluginPath);

      // 4. 自动启用
      if (autoEnable) {
        await this.enable(manifest.name);
      }

      return plugin;
    } finally {
      // 5. 清理临时文件
      await this.pluginDownloader.cleanup(tempDir);
    }
  }

  /**
   * 从插件市场安装
   */
  async installFromMarket(
    name: string,
    version?: string,
    marketUrl?: string,
    autoEnable = false,
  ): Promise<SysPlugin> {
    const targetMarket = marketUrl || this.defaultMarketUrl;
    this.logger.log(`Installing plugin ${name}@${version || 'latest'} from ${targetMarket}`);

    // 1. 获取插件信息
    const packageInfo = await this.pluginDownloader.fetchPluginInfo(
      targetMarket,
      name,
      version,
    );

    // 2. 下载并安装
    const { pluginPath, manifest, tempDir } = await this.pluginDownloader.downloadFromMarket(
      packageInfo,
    );

    try {
      // 3. 检查是否已安装
      const existing = await this.pluginRepo.findOne({
        where: { name: manifest.name },
      });
      if (existing) {
        throw new BadRequestException(
          `Plugin ${manifest.name} is already installed. Use update instead.`,
        );
      }

      // 4. 执行安装
      const plugin = await this.install(pluginPath);

      // 5. 自动启用
      if (autoEnable) {
        await this.enable(manifest.name);
      }

      return plugin;
    } finally {
      // 6. 清理临时文件
      await this.pluginDownloader.cleanup(tempDir);
    }
  }

  /**
   * 更新插件
   */
  async update(
    pluginName: string,
    version?: string,
    marketUrl?: string,
  ): Promise<SysPlugin> {
    const targetMarket = marketUrl || this.defaultMarketUrl;
    this.logger.log(`Updating plugin ${pluginName} to ${version || 'latest'}`);

    // 1. 检查当前插件
    const plugin = await this.pluginRepo.findOne({
      where: { name: pluginName },
    });
    if (!plugin) {
      throw new NotFoundException(`Plugin ${pluginName} not found`);
    }

    // 2. 获取新版本信息
    const packageInfo = await this.pluginDownloader.fetchPluginInfo(
      targetMarket,
      pluginName,
      version,
    );

    // 3. 检查版本
    const currentVersion = plugin.version;
    if (this.compareVersions(packageInfo.version, currentVersion) <= 0) {
      throw new BadRequestException(
        `Plugin ${pluginName} is already at version ${currentVersion} or higher`,
      );
    }

    // 4. 备份当前版本
    const backupPath = await this.backupPlugin(pluginName);

    try {
      // 5. 禁用当前插件
      if (plugin.status === 'enabled') {
        await this.disable(pluginName);
      }

      // 6. 卸载旧版本（保留配置）
      const oldConfig = plugin.config;
      await this.uninstall(pluginName);

      // 7. 安装新版本
      const { pluginPath, manifest, tempDir } = await this.pluginDownloader.downloadFromMarket(
        packageInfo,
      );

      try {
        const newPlugin = await this.install(pluginPath);
        
        // 8. 恢复配置
        newPlugin.config = oldConfig;
        await this.pluginRepo.save(newPlugin);

        // 9. 启用插件
        await this.enable(manifest.name);

        return newPlugin;
      } finally {
        await this.pluginDownloader.cleanup(tempDir);
      }
    } catch (error) {
      // 10. 回滚
      this.logger.error(`Update failed, rolling back...`);
      await this.restorePlugin(pluginName, backupPath);
      throw error;
    }
  }

  /**
   * 搜索插件市场
   */
  async searchMarket(
    keyword: string,
    marketUrl?: string,
  ): Promise<PluginPackageInfo[]> {
    const targetMarket = marketUrl || this.defaultMarketUrl;
    return this.pluginDownloader.searchMarket(targetMarket, keyword);
  }

  /**
   * 检查更新
   */
  async checkUpdate(
    pluginName: string,
    marketUrl?: string,
  ): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    packageInfo?: PluginPackageInfo;
  }> {
    const targetMarket = marketUrl || this.defaultMarketUrl;
    return this.pluginDownloader.checkUpdate(targetMarket, pluginName);
  }

  /**
   * 卸载插件
   */
  async uninstall(pluginName: string): Promise<void> {
    const plugin = await this.pluginRepo.findOne({
      where: { name: pluginName },
    });
    if (!plugin) {
      throw new NotFoundException(`Plugin ${pluginName} not found`);
    }

    // 1. 禁用插件
    if (plugin.status === 'enabled') {
      await this.disable(pluginName);
    }

    // 2. 删除菜单
    await this.menuInjector.removeMenus(plugin.id);

    // 3. 回滚迁移
    const manifest = plugin.manifest as PluginManifest;
    if (manifest.database?.migrations) {
      const pluginPath = path.join(this.pluginsDir, pluginName);
      await this.pluginLoader.rollbackMigrations(pluginPath, manifest.database.migrations);
    }

    // 4. 删除插件记录
    await this.pluginRepo.remove(plugin);

    // 5. 删除插件文件
    const pluginPath = path.join(this.pluginsDir, pluginName);
    if (fs.existsSync(pluginPath)) {
      fs.rmSync(pluginPath, { recursive: true, force: true });
    }

    this.logger.log(`Plugin ${pluginName} uninstalled successfully`);
  }

  /**
   * 启用插件
   */
  async enable(pluginName: string): Promise<void> {
    const plugin = await this.pluginRepo.findOne({
      where: { name: pluginName },
    });
    if (!plugin) {
      throw new NotFoundException(`Plugin ${pluginName} not found`);
    }

    if (plugin.status === 'enabled') {
      return;
    }

    const pluginPath = path.join(this.pluginsDir, pluginName);
    const manifest = plugin.manifest as PluginManifest;

    try {
      // 加载插件
      await this.pluginLoader.loadPlugin(pluginPath, manifest);
      await this.pluginLoader.enablePlugin(pluginName);

      // 更新状态
      plugin.status = 'enabled';
      plugin.lastActivatedAt = new Date();
      await this.pluginRepo.save(plugin);

      this.logger.log(`Plugin ${pluginName} enabled`);
    } catch (error) {
      plugin.status = 'error';
      plugin.errorMessage = error.message;
      await this.pluginRepo.save(plugin);
      throw error;
    }
  }

  /**
   * 禁用插件
   */
  async disable(pluginName: string): Promise<void> {
    const plugin = await this.pluginRepo.findOne({
      where: { name: pluginName },
    });
    if (!plugin) {
      throw new NotFoundException(`Plugin ${pluginName} not found`);
    }

    if (plugin.status !== 'enabled') {
      return;
    }

    // 卸载插件
    await this.pluginLoader.unloadPlugin(pluginName);

    // 更新状态
    plugin.status = 'disabled';
    await this.pluginRepo.save(plugin);

    this.logger.log(`Plugin ${pluginName} disabled`);
  }

  async findAll(): Promise<SysPlugin[]> {
    return this.pluginRepo.find({
      order: { installedAt: 'DESC' },
    });
  }

  async findEnabled(): Promise<SysPlugin[]> {
    return this.pluginRepo.find({
      where: { status: 'enabled' },
    });
  }

  async findOne(pluginName: string): Promise<SysPlugin> {
    const plugin = await this.pluginRepo.findOne({
      where: { name: pluginName },
    });
    if (!plugin) {
      throw new NotFoundException(`Plugin ${pluginName} not found`);
    }
    return plugin;
  }

  async updateConfig(pluginName: string, config: Record<string, any>): Promise<SysPlugin> {
    const plugin = await this.findOne(pluginName);
    plugin.config = { ...plugin.config, ...config };
    return this.pluginRepo.save(plugin);
  }

  async getFrontendPlugins(): Promise<Array<{ name: string; manifest: PluginManifest }>> {
    const enabledPlugins = await this.findEnabled();
    return enabledPlugins
      .filter(p => p.manifest?.frontend)
      .map(p => ({
        name: p.name,
        manifest: p.manifest as PluginManifest,
      }));
  }

  /**
   * 备份插件
   */
  private async backupPlugin(pluginName: string): Promise<string> {
    const pluginPath = path.join(this.pluginsDir, pluginName);
    const backupPath = path.join(this.pluginsDir, `.backup-${pluginName}-${Date.now()}`);
    
    if (fs.existsSync(pluginPath)) {
      fs.cpSync(pluginPath, backupPath, { recursive: true });
    }
    
    return backupPath;
  }

  /**
   * 恢复插件
   */
  private async restorePlugin(pluginName: string, backupPath: string): Promise<void> {
    const pluginPath = path.join(this.pluginsDir, pluginName);
    
    if (fs.existsSync(backupPath)) {
      if (fs.existsSync(pluginPath)) {
        fs.rmSync(pluginPath, { recursive: true, force: true });
      }
      fs.renameSync(backupPath, pluginPath);
    }
  }

  private readManifest(pluginPath: string): PluginManifest {
    const manifestPath = path.join(pluginPath, 'plugin.json');
    if (!fs.existsSync(manifestPath)) {
      throw new BadRequestException('plugin.json not found');
    }
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }
}
