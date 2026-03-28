import axios, { AxiosInstance } from 'axios';
import { PluginInfo, PluginManifest, PluginPackageInfo } from '../types';
import { PluginSource } from './config-manager';

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:3000', token?: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'x-cli-request': 'true',
        'user-agent': 'zayum-cli/1.0.0',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  // ========== 插件管理接口 ==========

  async getPlugins(): Promise<PluginInfo[]> {
    const response = await this.client.get('/plugin');
    return response.data;
  }

  async getEnabledPlugins(): Promise<PluginInfo[]> {
    const response = await this.client.get('/plugin/enabled');
    return response.data;
  }

  async getFrontendPlugins(): Promise<{ name: string; manifest: PluginManifest }[]> {
    const response = await this.client.get('/plugin/frontend');
    return response.data;
  }

  async installPlugin(pluginPath: string): Promise<PluginInfo> {
    const response = await this.client.post('/plugin/install', { pluginPath });
    return response.data;
  }

  async installFromUrl(url: string, autoEnable = false): Promise<PluginInfo> {
    const response = await this.client.post('/plugin/install-from-url', {
      url,
      autoEnable,
    });
    return response.data;
  }

  async installFromMarket(
    name: string,
    version?: string,
    marketUrl?: string,
    autoEnable = false,
  ): Promise<PluginInfo> {
    const response = await this.client.post('/plugin/install-from-market', {
      name,
      version,
      marketUrl,
      autoEnable,
    });
    return response.data;
  }

  async uninstallPlugin(name: string): Promise<void> {
    await this.client.post(`/plugin/${name}/uninstall`);
  }

  async enablePlugin(name: string): Promise<void> {
    await this.client.post(`/plugin/${name}/enable`);
  }

  async disablePlugin(name: string): Promise<void> {
    await this.client.post(`/plugin/${name}/disable`);
  }

  async updatePlugin(name: string, version?: string, marketUrl?: string): Promise<PluginInfo> {
    const response = await this.client.post(`/plugin/${name}/update`, {
      version,
      marketUrl,
    });
    return response.data;
  }

  async checkUpdate(name: string, marketUrl?: string): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
  }> {
    const response = await this.client.get(`/plugin/${name}/check-update`, {
      params: { marketUrl },
    });
    return response.data;
  }

  // ========== 市场接口 ==========

  async searchMarket(keyword: string, marketUrl?: string): Promise<PluginPackageInfo[]> {
    const response = await this.client.post('/plugin/market/search', {
      keyword,
      marketUrl,
    });
    // 后端返回 { code, message, data } 格式
    return response.data?.data || response.data || [];
  }

  // ========== 直接访问市场源 ==========

  async searchSource(source: PluginSource, keyword: string): Promise<PluginPackageInfo[]> {
    const response = await axios.get(`${source.url}/api/market/plugins`, {
      params: { keyword },
      timeout: 10000,
      headers: source.token ? { Authorization: `Bearer ${source.token}` } : {},
    });
    return response.data.items || response.data;
  }

  async getPluginInfoFromSource(
    source: PluginSource,
    name: string,
    version?: string,
  ): Promise<PluginPackageInfo> {
    const url = version
      ? `${source.url}/api/market/plugins/${name}/versions/${version}`
      : `${source.url}/api/market/plugins/${name}`;
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: source.token ? { Authorization: `Bearer ${source.token}` } : {},
    });
    return response.data;
  }
}

let apiClient: ApiClient | null = null;

export function initApiClient(baseURL?: string, token?: string): ApiClient {
  apiClient = new ApiClient(baseURL, token);
  return apiClient;
}

export function getApiClient(): ApiClient {
  if (!apiClient) {
    const baseURL = process.env.ZAYUM_API_URL || 'http://localhost:3000';
    const token = process.env.ZAYUM_API_TOKEN;
    apiClient = new ApiClient(baseURL, token);
  }
  return apiClient;
}
