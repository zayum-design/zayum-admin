import { Injectable } from '@nestjs/common';
import { PluginModule } from './interfaces';

interface RegisteredPlugin {
  name: string;
  module: any;
  instance?: PluginModule;
  manifest: any;
}

@Injectable()
export class PluginRegistry {
  private plugins = new Map<string, RegisteredPlugin>();

  register(name: string, module: any, manifest: any): void {
    this.plugins.set(name, { name, module, manifest });
  }

  unregister(name: string): void {
    this.plugins.delete(name);
  }

  get(name: string): RegisteredPlugin | undefined {
    return this.plugins.get(name);
  }

  getAll(): RegisteredPlugin[] {
    return Array.from(this.plugins.values());
  }

  getEnabled(): RegisteredPlugin[] {
    return this.getAll().filter(p => this.isEnabled(p.name));
  }

  isEnabled(name: string): boolean {
    // 实际检查数据库状态
    return this.plugins.has(name);
  }

  setInstance(name: string, instance: PluginModule): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.instance = instance;
    }
  }

  getInstance(name: string): PluginModule | undefined {
    return this.plugins.get(name)?.instance;
  }
}
