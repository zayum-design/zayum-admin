export interface PluginManifest {
  name: string;
  version: string;
  displayName: string;
  description?: string;
  author?: string;
  backend?: {
    entry: string;
    migrations?: string[];
    entities?: string[];
    dependencies?: string[];
  };
  frontend?: {
    entry: string;
    routes?: boolean;
    menu?: boolean | MenuConfig[];
    hooks?: {
      login?: boolean;
      register?: boolean;
    };
  };
  database?: {
    entities?: string[];
    migrations?: string[];
  };
}

export interface MenuConfig {
  key: string;
  name: string;
  path?: string;
  component?: string;
  icon?: string;
  parentKey?: string;
  order?: number;
  permission?: string;
}

export interface PluginInfo {
  id: number;
  name: string;
  displayName: string;
  version: string;
  description: string;
  status: 'installed' | 'enabled' | 'disabled' | 'error';
  installedAt: string;
  updatedAt: string;
}

export interface CLIOptions {
  apiUrl?: string;
  token?: string;
}

export interface PluginPackageInfo {
  name: string;
  version: string;
  displayName: string;
  description: string;
  author: string;
  downloadUrl: string;
  hash: string;
  hashAlgorithm: string;
  size: number;
  downloads?: number;
  requirements?: {
    backend?: string;
    frontend?: string;
  };
}
