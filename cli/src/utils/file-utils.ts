import * as fs from 'fs-extra';
import * as path from 'path';

const PLUGINS_DIR = path.join(process.cwd(), 'plugins');

export async function ensurePluginsDir(): Promise<string> {
  await fs.ensureDir(PLUGINS_DIR);
  return PLUGINS_DIR;
}

export function getPluginPath(pluginName: string): string {
  return path.join(PLUGINS_DIR, pluginName);
}

export async function copyPlugin(sourcePath: string, destPath: string): Promise<void> {
  await fs.copy(sourcePath, destPath);
}

export async function removePlugin(pluginName: string): Promise<void> {
  const pluginPath = getPluginPath(pluginName);
  await fs.remove(pluginPath);
}

export async function listLocalPlugins(): Promise<string[]> {
  if (!fs.existsSync(PLUGINS_DIR)) {
    return [];
  }
  const items = await fs.readdir(PLUGINS_DIR);
  const plugins: string[] = [];
  
  for (const item of items) {
    const pluginPath = path.join(PLUGINS_DIR, item);
    const stat = await fs.stat(pluginPath);
    if (stat.isDirectory() && fs.existsSync(path.join(pluginPath, 'plugin.json'))) {
      plugins.push(item);
    }
  }
  
  return plugins;
}
