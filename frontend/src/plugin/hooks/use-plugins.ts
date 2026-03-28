import { useEffect, useState } from 'react';
import { FrontendPlugin, PluginMenuItem } from '../types';
import { getPluginLoader } from '../plugin-loader';
import { getMenuRegistry } from '../menu-registry';

export function usePlugins() {
  const [plugins, setPlugins] = useState<FrontendPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPlugins() {
      try {
        setLoading(true);
        const loader = getPluginLoader();
        const loadedPlugins = await loader.loadAllPlugins();
        
        if (mounted) {
          setPlugins(loadedPlugins);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPlugins();

    return () => {
      mounted = false;
    };
  }, []);

  return { plugins, loading, error };
}

export function usePluginMenus() {
  const [menus, setMenus] = useState<PluginMenuItem[]>([]);

  useEffect(() => {
    const registry = getMenuRegistry();
    
    setMenus(registry.getMenuItems());

    const unsubscribe = registry.subscribe(setMenus);

    return unsubscribe;
  }, []);

  return menus;
}

export function usePlugin(name: string) {
  const loader = getPluginLoader();
  return loader.getPlugin(name);
}
