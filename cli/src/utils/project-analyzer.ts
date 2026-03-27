import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

export interface ProjectStructure {
  type: 'backend' | 'frontend' | 'fullstack' | 'unknown';
  rootPath: string;
  backend?: {
    path: string;
    framework: string;
    entitiesPath: string;
    modulesPath: string;
    databasePath: string;
    existingEntities: string[];
    existingModules: string[];
  };
  frontend?: {
    path: string;
    framework: string;
    componentsPath: string;
    pagesPath: string;
    apiPath: string;
  };
}

export class ProjectAnalyzer {
  private rootPath: string;

  constructor(rootPath: string = process.cwd()) {
    this.rootPath = rootPath;
  }

  /**
   * 分析项目结构
   */
  async analyze(): Promise<ProjectStructure> {
    const structure: ProjectStructure = {
      type: 'unknown',
      rootPath: this.rootPath,
    };

    // 检测后端
    const backendInfo = await this.detectBackend();
    if (backendInfo) {
      structure.type = 'backend';
      structure.backend = backendInfo;
    }

    // 检测前端
    const frontendInfo = await this.detectFrontend();
    if (frontendInfo) {
      structure.type = structure.type === 'backend' ? 'fullstack' : 'frontend';
      structure.frontend = frontendInfo;
    }

    return structure;
  }

  /**
   * 检测后端项目
   */
  private async detectBackend() {
    const possiblePaths = ['backend', 'server', 'api', '.'];
    
    for (const dir of possiblePaths) {
      const fullPath = path.join(this.rootPath, dir);
      if (!await fs.pathExists(fullPath)) continue;

      // 检测 NestJS
      const packageJsonPath = path.join(fullPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (deps['@nestjs/core']) {
          return this.analyzeNestJS(fullPath);
        }
      }
    }

    return null;
  }

  /**
   * 分析 NestJS 项目
   */
  private async analyzeNestJS(backendPath: string) {
    const entitiesPath = path.join(backendPath, 'src/entities');
    const modulesPath = path.join(backendPath, 'src/modules');
    const databasePath = path.join(backendPath, 'src/database');

    const existingEntities: string[] = [];
    const existingModules: string[] = [];

    // 获取已有实体
    if (await fs.pathExists(entitiesPath)) {
      const entityFiles = await glob('*.entity.ts', { cwd: entitiesPath });
      existingEntities.push(...entityFiles.map(f => f.replace('.entity.ts', '')));
    }

    // 获取已有模块
    if (await fs.pathExists(modulesPath)) {
      const moduleDirs = await fs.readdir(modulesPath, { withFileTypes: true });
      existingModules.push(...moduleDirs.filter(d => d.isDirectory()).map(d => d.name));
    }

    return {
      path: backendPath,
      framework: 'nestjs',
      entitiesPath,
      modulesPath,
      databasePath,
      existingEntities,
      existingModules,
    };
  }

  /**
   * 检测前端项目
   */
  private async detectFrontend() {
    const possiblePaths = ['frontend', 'web', 'client', '.'];
    
    for (const dir of possiblePaths) {
      const fullPath = path.join(this.rootPath, dir);
      if (!await fs.pathExists(fullPath)) continue;

      const packageJsonPath = path.join(fullPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        if (deps['vue']) {
          return this.analyzeVue(fullPath);
        }
        if (deps['react']) {
          return this.analyzeReact(fullPath);
        }
      }
    }

    return null;
  }

  /**
   * 分析 Vue 项目
   */
  private async analyzeVue(frontendPath: string) {
    const srcPath = path.join(frontendPath, 'src');
    return {
      path: frontendPath,
      framework: 'vue',
      componentsPath: path.join(srcPath, 'components'),
      pagesPath: path.join(srcPath, 'views'),
      apiPath: path.join(srcPath, 'api'),
    };
  }

  /**
   * 分析 React 项目
   */
  private async analyzeReact(frontendPath: string) {
    const srcPath = path.join(frontendPath, 'src');
    return {
      path: frontendPath,
      framework: 'react',
      componentsPath: path.join(srcPath, 'components'),
      pagesPath: path.join(srcPath, 'pages'),
      apiPath: path.join(srcPath, 'api'),
    };
  }

  /**
   * 生成项目结构描述
   */
  generateStructureDescription(structure: ProjectStructure): string {
    const lines: string[] = [];
    
    lines.push(`项目根目录: ${structure.rootPath}`);
    lines.push(`项目类型: ${structure.type}`);
    lines.push('');

    if (structure.backend) {
      lines.push(`## 后端 (${structure.backend.framework})`);
      lines.push('');
      lines.push(`### 目录结构`);
      lines.push(`\`\`\``);
      lines.push(`${structure.backend.path}/src/`);
      lines.push(`├── database/                   # 数据库迁移脚本`);
      lines.push(`│   └── add_{name}_table.sql    # 数据库表创建脚本`);
      lines.push(`├── entities/                    # 数据库实体`);
      lines.push(`│   └── sys-{name}.entity.ts    # 实体文件`);
      lines.push(`├── modules/                     # 功能模块`);
      lines.push(`│   └── {module-name}/           # 模块目录`);
      lines.push(`│       ├── dto/                 # DTO目录`);
      lines.push(`│       │   ├── create-{name}.dto.ts`);
      lines.push(`│       │   ├── update-{name}.dto.ts`);
      lines.push(`│       │   └── query-{name}.dto.ts`);
      lines.push(`│       ├── {name}.controller.ts # 控制器`);
      lines.push(`│       ├── {name}.service.ts    # 服务`);
      lines.push(`│       └── {name}.module.ts     # 模块定义`);
      lines.push(`└── app.module.ts               # 根模块`);
      lines.push(`\`\`\``);
      lines.push('');
      lines.push(`### 文件生成位置`);
      lines.push(`- 数据库迁移: \`${structure.backend.databasePath}/add_{name}_table.sql\``);
      lines.push(`- Entity: \`${structure.backend.entitiesPath}/sys-{name}.entity.ts\``);
      lines.push(`- DTOs: \`${structure.backend.modulesPath}/{name}/dto/\``);
      lines.push(`- Controller: \`${structure.backend.modulesPath}/{name}/{name}.controller.ts\``);
      lines.push(`- Service: \`${structure.backend.modulesPath}/{name}/{name}.service.ts\``);
      lines.push(`- Module: \`${structure.backend.modulesPath}/{name}/{name}.module.ts\``);
      lines.push(`- Root Module: \`${structure.backend.path}/src/app.module.ts\``);
      lines.push('');
      
      if (structure.backend.existingEntities.length > 0) {
        lines.push(`### 已有实体`);
        structure.backend.existingEntities.forEach(e => {
          lines.push(`- ${e}.entity.ts`);
        });
        lines.push('');
      }
      if (structure.backend.existingModules.length > 0) {
        lines.push(`### 已有模块`);
        structure.backend.existingModules.forEach(m => {
          lines.push(`- ${m}/`);
        });
        lines.push('');
      }
    }

    if (structure.frontend) {
      lines.push(`## 前端 (${structure.frontend.framework})`);
      lines.push('');
      lines.push(`### 目录结构`);
      lines.push(`\`\`\``);
      lines.push(`${structure.frontend.path}/src/`);
      lines.push(`├── pages/                       # 页面组件`);
      lines.push(`│   └── {module-name}/           # 模块页面目录`);
      lines.push(`│       ├── index.tsx           # 列表页`);
      lines.push(`│       ├── create.tsx          # 创建页`);
      lines.push(`│       ├── edit.tsx            # 编辑页`);
      lines.push(`│       └── detail.tsx          # 详情页`);
      lines.push(`├── services/                    # API服务`);
      lines.push(`│   └── {name}.service.ts       # 模块API`);
      lines.push(`├── components/                  # 公共组件`);
      lines.push(`└── types/                       # 类型定义`);
      lines.push(`\`\`\``);
      lines.push('');
      lines.push(`### 文件生成位置`);
      lines.push(`- API Service: \`${structure.frontend.apiPath}/{name}.service.ts\``);
      lines.push(`- Pages: \`${structure.frontend.pagesPath}/{name}/\``);
      lines.push('');
    }

    return lines.join('\n');
  }
}
