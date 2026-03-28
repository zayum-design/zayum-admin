import { FrontendPlugin, PluginInfo, PluginLoadOptions } from './types';

class PluginLoader {
  private plugins: Map<string, FrontendPlugin> = new Map();
  private options: PluginLoadOptions;

  constructor(options: PluginLoadOptions = {}) {
    this.options = {
      apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      ...options,
    };
  }

  async fetchPlugins(): Promise<PluginInfo[]> {
    try {
      const response = await fetch(`${this.options.apiBaseUrl}/plugin/frontend`);
      if (!response.ok) {
        throw new Error('Failed to fetch plugins');
      }
      return response.json();
    } catch (error) {
      console.error('Failed to fetch plugins:', error);
      return [];
    }
  }

  async loadPlugin(pluginInfo: PluginInfo): Promise<FrontendPlugin | null> {
    try {
      const { name, manifest } = pluginInfo;
      
      if (!manifest.frontend) {
        console.log(`Plugin ${name} has no frontend component`);
        return null;
      }

      const module = await this.importPlugin(name, manifest.frontend.entry);
      
      if (!module || !module.default) {
        console.error(`Plugin ${name} has no default export`);
        return null;
      }

      const plugin: FrontendPlugin = {
        name,
        version: pluginInfo.version,
        displayName: pluginInfo.displayName,
        ...module.default,
      };

      if (plugin.init) {
        await plugin.init();
      }

      this.plugins.set(name, plugin);
      console.log(`✅ Plugin ${name} loaded`);
      
      return plugin;
    } catch (error) {
      console.error(`Failed to load plugin ${pluginInfo.name}:`, error);
      return null;
    }
  }

  async loadAllPlugins(): Promise<FrontendPlugin[]> {
    const pluginInfos = await this.fetchPlugins();
    const loadedPlugins: FrontendPlugin[] = [];

    for (const info of pluginInfos) {
      const plugin = await this.loadPlugin(info);
      if (plugin) {
        loadedPlugins.push(plugin);
      }
    }

    return loadedPlugins;
  }

  async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (plugin?.destroy) {
      await plugin.destroy();
    }
    this.plugins.delete(name);
  }

  getAllPlugins(): FrontendPlugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(name: string): FrontendPlugin | undefined {
    return this.plugins.get(name);
  }

  isLoaded(name: string): boolean {
    return this.plugins.has(name);
  }

  private async importPlugin(name: string, entry: string): Promise<any> {
    if (entry.startsWith('http')) {
      return import(/* @vite-ignore */ entry);
    }

    try {
      return await import(`../../plugins/${name}/frontend/src/index.ts`);
    } catch {
      return await import(`./plugins/${name}/index.js`);
    }
  }
}

let instance: PluginLoader | null = null;

export function createPluginLoader(options?: PluginLoadOptions): PluginLoader {
  instance = new PluginLoader(options);
  return instance;
}

export function getPluginLoader(): PluginLoader {
  if (!instance) {
    instance = new PluginLoader();
  }
  return instance;
}

export { PluginLoader };
