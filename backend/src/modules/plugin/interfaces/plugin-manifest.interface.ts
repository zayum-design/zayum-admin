export interface PluginManifest {
  name: string;           // 插件标识名
  version: string;        // 版本号
  displayName: string;    // 显示名称
  description?: string;   // 描述
  author?: string;        // 作者
  
  backend?: {
    entry: string;        // 模块入口文件
    migrations?: string[]; // 迁移文件路径
    entities?: string[];  // 实体文件路径
    dependencies?: string[]; // npm 依赖
  };
  
  frontend?: {
    entry: string;        // 前端入口
    routes?: boolean;     // 是否注册路由
    menu?: boolean | MenuConfig[]; // 菜单配置
    hooks?: {
      login?: boolean;    // 是否有登录钩子
      register?: boolean; // 是否有注册钩子
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
