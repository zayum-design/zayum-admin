import { PluginMenuItem, FrontendPlugin } from './types';

class MenuRegistry {
  private menuItems: PluginMenuItem[] = [];
  private listeners: Set<(items: PluginMenuItem[]) => void> = new Set();

  registerFromPlugin(plugin: FrontendPlugin): void {
    if (!plugin.menuItems) return;

    const prefixedItems = plugin.menuItems.map(item => ({
      ...item,
      key: `plugin:${plugin.name}:${item.key}`,
      children: item.children?.map(child => ({
        ...child,
        key: `plugin:${plugin.name}:${child.key}`,
      })),
    }));

    this.menuItems.push(...prefixedItems);
    this.notifyListeners();
  }

  registerFromPlugins(plugins: FrontendPlugin[]): void {
    plugins.forEach(plugin => this.registerFromPlugin(plugin));
  }

  getMenuItems(): PluginMenuItem[] {
    return [...this.menuItems].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  clear(): void {
    this.menuItems = [];
    this.notifyListeners();
  }

  subscribe(listener: (items: PluginMenuItem[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const items = this.getMenuItems();
    this.listeners.forEach(listener => listener(items));
  }
}

let instance: MenuRegistry | null = null;

export function getMenuRegistry(): MenuRegistry {
  if (!instance) {
    instance = new MenuRegistry();
  }
  return instance;
}

export { MenuRegistry };
