import { LoginHook, RegisterHook, FrontendPlugin } from './types';
import { ReactNode } from 'react';

class HookSystem {
  private loginHooks: LoginHook[] = [];
  private registerHooks: RegisterHook[] = [];

  registerFromPlugin(plugin: FrontendPlugin): void {
    if (plugin.hooks?.login) {
      this.loginHooks.push(plugin.hooks.login);
    }
    if (plugin.hooks?.register) {
      this.registerHooks.push(plugin.hooks.register);
    }
  }

  registerFromPlugins(plugins: FrontendPlugin[]): void {
    plugins.forEach(plugin => this.registerFromPlugin(plugin));
  }

  getLoginFormExtensions(): (() => ReactNode)[] {
    return this.loginHooks
      .map(hook => hook.extendForm)
      .filter(Boolean) as (() => ReactNode)[];
  }

  async executeBeforeLogin(values: any): Promise<boolean | string> {
    for (const hook of this.loginHooks) {
      if (hook.beforeLogin) {
        const result = await hook.beforeLogin(values);
        if (result !== true) {
          return result === false ? 'Login blocked by plugin' : result;
        }
      }
    }
    return true;
  }

  async executeAfterLogin(user: any): Promise<void> {
    for (const hook of this.loginHooks) {
      if (hook.afterLogin) {
        await hook.afterLogin(user);
      }
    }
  }

  getRegisterFormExtensions(): (() => ReactNode)[] {
    return this.registerHooks
      .map(hook => hook.extendForm)
      .filter(Boolean) as (() => ReactNode)[];
  }

  async executeBeforeRegister(values: any): Promise<boolean | string> {
    for (const hook of this.registerHooks) {
      if (hook.beforeRegister) {
        const result = await hook.beforeRegister(values);
        if (result !== true) {
          return result === false ? 'Registration blocked by plugin' : result;
        }
      }
    }
    return true;
  }

  async executeAfterRegister(user: any): Promise<void> {
    for (const hook of this.registerHooks) {
      if (hook.afterRegister) {
        await hook.afterRegister(user);
      }
    }
  }

  clear(): void {
    this.loginHooks = [];
    this.registerHooks = [];
  }
}

let instance: HookSystem | null = null;

export function getHookSystem(): HookSystem {
  if (!instance) {
    instance = new HookSystem();
  }
  return instance;
}

export { HookSystem };
