import { RouteObject } from 'react-router-dom';
import { PluginRoute, FrontendPlugin } from './types';

class RouteRegistry {
  private routes: RouteObject[] = [];

  registerFromPlugin(plugin: FrontendPlugin): void {
    if (!plugin.routes) return;

    const routeObjects = this.convertToRouteObjects(plugin.routes);
    this.routes.push(...routeObjects);
  }

  registerFromPlugins(plugins: FrontendPlugin[]): void {
    plugins.forEach(plugin => this.registerFromPlugin(plugin));
  }

  getRoutes(): RouteObject[] {
    return this.routes;
  }

  clear(): void {
    this.routes = [];
  }

  private convertToRouteObjects(routes: PluginRoute[]): RouteObject[] {
    return routes.map(route => ({
      path: route.path,
      element: <route.component />,
      children: route.children ? this.convertToRouteObjects(route.children) : undefined,
    }));
  }
}

let instance: RouteRegistry | null = null;

export function getRouteRegistry(): RouteRegistry {
  if (!instance) {
    instance = new RouteRegistry();
  }
  return instance;
}

export { RouteRegistry };
