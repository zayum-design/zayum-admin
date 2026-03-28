import * as fs from 'fs-extra';
import * as path from 'path';
import { PluginManifest } from '../types';

export class PluginValidator {
  static async validate(pluginPath: string): Promise<PluginManifest> {
    if (!fs.existsSync(pluginPath)) {
      throw new Error(`Plugin path does not exist: ${pluginPath}`);
    }

    const manifestPath = path.join(pluginPath, 'plugin.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('plugin.json not found in plugin directory');
    }

    const manifest: PluginManifest = await fs.readJson(manifestPath);
    this.validateManifest(manifest);

    if (manifest.backend?.entry) {
      const backendEntry = path.join(pluginPath, manifest.backend.entry);
      if (!fs.existsSync(backendEntry)) {
        throw new Error(`Backend entry not found: ${manifest.backend.entry}`);
      }
    }

    if (manifest.frontend?.entry) {
      const frontendEntry = path.join(pluginPath, manifest.frontend.entry);
      if (!fs.existsSync(frontendEntry)) {
        throw new Error(`Frontend entry not found: ${manifest.frontend.entry}`);
      }
    }

    return manifest;
  }

  private static validateManifest(manifest: any): void {
    if (!manifest.name || typeof manifest.name !== 'string') {
      throw new Error('Invalid or missing "name" in plugin.json');
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      throw new Error('Invalid or missing "version" in plugin.json');
    }

    if (!manifest.displayName || typeof manifest.displayName !== 'string') {
      throw new Error('Invalid or missing "displayName" in plugin.json');
    }

    if (!/^[a-z0-9-]+$/.test(manifest.name)) {
      throw new Error('Plugin name must contain only lowercase letters, numbers, and hyphens');
    }

    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error('Version must follow semantic versioning (e.g., 1.0.0)');
    }
  }

  static validateName(name: string): void {
    if (!/^[a-z0-9-]+$/.test(name)) {
      throw new Error('Plugin name must contain only lowercase letters, numbers, and hyphens');
    }
  }
}
