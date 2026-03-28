import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export interface PluginSource {
  name: string;
  url: string;
  token?: string;
  enabled: boolean;
  isDefault?: boolean;
}

export interface CLIConfig {
  defaultSource: string;
  sources: Record<string, PluginSource>;
  apiToken?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.zayum');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: CLIConfig = {
  defaultSource: 'official',
  sources: {
    official: {
      name: 'official',
      url: 'https://market.zayum.com',
      enabled: true,
      isDefault: true,
    },
  },
};

export class ConfigManager {
  private config: CLIConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): CLIConfig {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return { ...DEFAULT_CONFIG, ...fs.readJsonSync(CONFIG_FILE) };
      }
    } catch (error) {
      console.warn('Failed to load config, using defaults');
    }
    return { ...DEFAULT_CONFIG };
  }

  async saveConfig(): Promise<void> {
    await fs.ensureDir(CONFIG_DIR);
    await fs.writeJson(CONFIG_FILE, this.config, { spaces: 2 });
  }

  getConfig(): CLIConfig {
    return this.config;
  }

  getDefaultSource(): PluginSource {
    const source = this.config.sources[this.config.defaultSource];
    if (!source || !source.enabled) {
      // 返回第一个启用的源
      const enabled = Object.values(this.config.sources).find(s => s.enabled);
      if (enabled) return enabled;
      throw new Error('No enabled plugin source found');
    }
    return source;
  }

  getSource(name: string): PluginSource | undefined {
    return this.config.sources[name];
  }

  getAllSources(): PluginSource[] {
    return Object.values(this.config.sources);
  }

  async addSource(source: PluginSource): Promise<void> {
    this.config.sources[source.name] = source;
    await this.saveConfig();
  }

  async removeSource(name: string): Promise<void> {
    if (this.config.sources[name]?.isDefault) {
      throw new Error('Cannot remove default source');
    }
    delete this.config.sources[name];
    if (this.config.defaultSource === name) {
      this.config.defaultSource = 'official';
    }
    await this.saveConfig();
  }

  async setDefaultSource(name: string): Promise<void> {
    if (!this.config.sources[name]) {
      throw new Error(`Source ${name} not found`);
    }
    // 清除之前的默认
    Object.values(this.config.sources).forEach(s => (s.isDefault = false));
    // 设置新的默认
    this.config.sources[name].isDefault = true;
    this.config.defaultSource = name;
    await this.saveConfig();
  }

  async enableSource(name: string): Promise<void> {
    if (!this.config.sources[name]) {
      throw new Error(`Source ${name} not found`);
    }
    this.config.sources[name].enabled = true;
    await this.saveConfig();
  }

  async disableSource(name: string): Promise<void> {
    if (this.config.sources[name]?.isDefault) {
      throw new Error('Cannot disable default source');
    }
    if (!this.config.sources[name]) {
      throw new Error(`Source ${name} not found`);
    }
    this.config.sources[name].enabled = false;
    await this.saveConfig();
  }

  getApiToken(): string | undefined {
    return this.config.apiToken;
  }

  async setApiToken(token: string): Promise<void> {
    this.config.apiToken = token;
    await this.saveConfig();
  }
}

let instance: ConfigManager | null = null;

export function getConfigManager(): ConfigManager {
  if (!instance) {
    instance = new ConfigManager();
  }
  return instance;
}
