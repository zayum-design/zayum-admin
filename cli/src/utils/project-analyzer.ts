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
    
    lines.push(`# 项目结构分析`);
    lines.push(`项目根目录: ${structure.rootPath}`);
    lines.push(`项目类型: ${structure.type}`);
    lines.push('');

    if (structure.backend) {
      lines.push(`## 后端 (${structure.backend.framework})`);
      lines.push(`- 路径: ${structure.backend.path}`);
      lines.push(`- 实体目录: ${structure.backend.entitiesPath}`);
      lines.push(`- 模块目录: ${structure.backend.modulesPath}`);
      
      if (structure.backend.existingEntities.length > 0) {
        lines.push(`- 已有实体: ${structure.backend.existingEntities.join(', ')}`);
      }
      if (structure.backend.existingModules.length > 0) {
        lines.push(`- 已有模块: ${structure.backend.existingModules.join(', ')}`);
      }
      lines.push('');
    }

    if (structure.frontend) {
      lines.push(`## 前端 (${structure.frontend.framework})`);
      lines.push(`- 路径: ${structure.frontend.path}`);
      lines.push(`- 组件目录: ${structure.frontend.componentsPath}`);
      lines.push(`- 页面目录: ${structure.frontend.pagesPath}`);
      lines.push(`- API 目录: ${structure.frontend.apiPath}`);
      lines.push('');
    }

    return lines.join('\n');
  }
}
