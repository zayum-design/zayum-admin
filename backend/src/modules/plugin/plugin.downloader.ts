import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysPlugin } from '../../entities/sys-plugin.entity';
import { PluginManifest } from './interfaces';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import axios from 'axios';
import extractZip from 'extract-zip';

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
  requirements?: {
    backend?: string;
    frontend?: string;
  };
}

export interface DownloadResult {
  pluginPath: string;
  manifest: PluginManifest;
  tempDir: string;
}

@Injectable()
export class PluginDownloader {
  private readonly logger = new Logger(PluginDownloader.name);
  private readonly pluginsDir: string;
  private readonly tempDir: string;

  constructor(
    @InjectRepository(SysPlugin)
    private pluginRepo: Repository<SysPlugin>,
  ) {
    this.pluginsDir = path.join(process.cwd(), 'plugins');
    this.tempDir = path.join(process.cwd(), 'temp', 'plugins');
  }

  /**
   * 从远端下载插件
   */
  async downloadFromUrl(
    downloadUrl: string,
    expectedHash?: string,
    expectedHashAlgorithm = 'sha256',
  ): Promise<DownloadResult> {
    this.logger.log(`Downloading plugin from: ${downloadUrl}`);

    // 创建临时目录
    const tempId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const tempDownloadDir = path.join(this.tempDir, tempId);
    const zipPath = path.join(tempDownloadDir, 'plugin.zip');

    await fs.ensureDir(tempDownloadDir);

    try {
      // 下载文件
      await this.downloadFile(downloadUrl, zipPath);

      // 验证文件哈希
      if (expectedHash) {
        const fileHash = await this.calculateFileHash(zipPath, expectedHashAlgorithm);
        if (fileHash !== expectedHash) {
          throw new Error(
            `Hash verification failed. Expected: ${expectedHash}, Got: ${fileHash}`,
          );
        }
        this.logger.log('Hash verification passed');
      }

      // 解压
      const extractDir = path.join(tempDownloadDir, 'extracted');
      await fs.ensureDir(extractDir);
      await extractZip(zipPath, { dir: extractDir });

      // 读取 manifest
      const manifest = await this.readManifest(extractDir);

      // 移动到插件目录
      const pluginPath = path.join(this.pluginsDir, manifest.name);
      await fs.ensureDir(path.dirname(pluginPath));
      
      // 如果已存在，先删除
      if (await fs.pathExists(pluginPath)) {
        await fs.remove(pluginPath);
      }

      // 移动文件
      const extractedContent = await fs.readdir(extractDir);
      if (extractedContent.length === 1 && (await fs.stat(path.join(extractDir, extractedContent[0]))).isDirectory()) {
        // 如果解压后只有一个目录，使用其内容
        await fs.move(path.join(extractDir, extractedContent[0]), pluginPath);
      } else {
        // 否则移动整个目录
        await fs.move(extractDir, pluginPath);
      }

      this.logger.log(`Plugin downloaded and extracted to: ${pluginPath}`);

      return {
        pluginPath,
        manifest,
        tempDir: tempDownloadDir,
      };
    } catch (error) {
      // 清理临时目录
      await fs.remove(tempDownloadDir).catch(() => {});
      throw error;
    }
  }

  /**
   * 从插件市场信息下载
   */
  async downloadFromMarket(packageInfo: PluginPackageInfo): Promise<DownloadResult> {
    return this.downloadFromUrl(
      packageInfo.downloadUrl,
      packageInfo.hash,
      'sha256',
    );
  }

  /**
   * 查询远端插件信息
   */
  async fetchPluginInfo(marketUrl: string, pluginName: string, version?: string): Promise<PluginPackageInfo> {
    const url = version 
      ? `${marketUrl}/api/market/plugins/${pluginName}/versions/${version}`
      : `${marketUrl}/api/market/plugins/${pluginName}`;

    try {
      const response = await axios.get(url, { timeout: 10000 });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch plugin info from ${url}:`, error.message);
      throw new Error(`Failed to fetch plugin info: ${error.message}`);
    }
  }

  /**
   * 搜索插件市场
   */
  async searchMarket(marketUrl: string, keyword: string): Promise<PluginPackageInfo[]> {
    try {
      const response = await axios.get(`${marketUrl}/api/market/plugins`, {
        params: { keyword },
        timeout: 10000,
      });
      return response.data.items || response.data;
    } catch (error) {
      this.logger.error(`Failed to search market:`, error.message);
      throw new Error(`Failed to search market: ${error.message}`);
    }
  }

  /**
   * 检查更新
   */
  async checkUpdate(marketUrl: string, pluginName: string): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    packageInfo?: PluginPackageInfo;
  }> {
    const plugin = await this.pluginRepo.findOne({ where: { name: pluginName } });
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not installed`);
    }

    const latestInfo = await this.fetchPluginInfo(marketUrl, pluginName);
    const hasUpdate = this.compareVersions(latestInfo.version, plugin.version) > 0;

    return {
      hasUpdate,
      currentVersion: plugin.version,
      latestVersion: latestInfo.version,
      packageInfo: hasUpdate ? latestInfo : undefined,
    };
  }

  /**
   * 清理临时文件
   */
  async cleanup(tempDir: string): Promise<void> {
    try {
      await fs.remove(tempDir);
    } catch (error) {
      this.logger.warn(`Failed to cleanup temp dir ${tempDir}:`, error.message);
    }
  }

  /**
   * 下载文件
   */
  private async downloadFile(url: string, destPath: string): Promise<void> {
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
      timeout: 60000,
      headers: {
        'User-Agent': 'Zayum-Plugin-Downloader/1.0',
      },
    });

    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
      response.data.on('error', reject);
    });
  }

  /**
   * 计算文件哈希
   */
  private async calculateFileHash(filePath: string, algorithm: string): Promise<string> {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * 读取插件 manifest
   */
  private async readManifest(pluginPath: string): Promise<PluginManifest> {
    const manifestPath = path.join(pluginPath, 'plugin.json');
    if (!await fs.pathExists(manifestPath)) {
      throw new Error('plugin.json not found in downloaded package');
    }
    return fs.readJson(manifestPath);
  }

  /**
   * 比较版本号
   * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   */
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
