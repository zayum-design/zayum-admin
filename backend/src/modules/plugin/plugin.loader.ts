import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PluginRegistry } from './plugin.registry';
import { PluginManifest, PluginModule } from './interfaces';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PluginLoader {
  private readonly logger = new Logger(PluginLoader.name);

  constructor(
    private moduleRef: ModuleRef,
    private registry: PluginRegistry,
  ) {}

  async loadPlugin(pluginPath: string, manifest: PluginManifest): Promise<any> {
    try {
      // 1. 加载后端模块
      if (manifest.backend?.entry) {
        const modulePath = path.join(pluginPath, manifest.backend.entry);
        
        if (!fs.existsSync(modulePath)) {
          throw new Error(`Plugin module not found: ${modulePath}`);
        }

        // 动态导入模块
        const moduleClass = await this.importModule(modulePath);
        
        // 注册到注册表
        this.registry.register(manifest.name, moduleClass, manifest);
        
        this.logger.log(`Plugin ${manifest.name} loaded successfully`);
        return moduleClass;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Failed to load plugin ${manifest.name}:`, error);
      throw error;
    }
  }

  async unloadPlugin(pluginName: string): Promise<void> {
    const plugin = this.registry.get(pluginName);
    if (plugin?.instance?.onDisable) {
      await plugin.instance.onDisable();
    }
    this.registry.unregister(pluginName);
    this.logger.log(`Plugin ${pluginName} unloaded`);
  }

  async enablePlugin(pluginName: string): Promise<void> {
    const plugin = this.registry.get(pluginName);
    if (plugin?.instance?.onEnable) {
      await plugin.instance.onEnable();
    }
  }

  async disablePlugin(pluginName: string): Promise<void> {
    const plugin = this.registry.get(pluginName);
    if (plugin?.instance?.onDisable) {
      await plugin.instance.onDisable();
    }
  }

  private async importModule(modulePath: string): Promise<any> {
    // 清除 require 缓存
    delete require.cache[require.resolve(modulePath)];
    const module = require(modulePath);
    // 获取默认导出或命名导出
    return module.default || module;
  }

  async executeMigrations(pluginPath: string, migrations: string[]): Promise<void> {
    // 执行数据库迁移
    for (const migrationPath of migrations) {
      const fullPath = path.join(pluginPath, migrationPath);
      if (fs.existsSync(fullPath)) {
        // 使用 TypeORM 执行迁移
        this.logger.log(`Executing migration: ${fullPath}`);
        // 具体实现取决于迁移方式
      }
    }
  }

  async rollbackMigrations(pluginPath: string, migrations: string[]): Promise<void> {
    // 回滚数据库迁移
    for (const migrationPath of migrations) {
      const fullPath = path.join(pluginPath, migrationPath);
      if (fs.existsSync(fullPath)) {
        this.logger.log(`Rolling back migration: ${fullPath}`);
      }
    }
  }
}
