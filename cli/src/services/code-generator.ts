import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectStructure } from '../utils/project-analyzer';

export interface GeneratedFile {
  path: string;
  content: string;
  description?: string;
}

export interface CodeGenerationResult {
  entity?: GeneratedFile;
  dto?: GeneratedFile[];
  service?: GeneratedFile;
  controller?: GeneratedFile;
  module?: GeneratedFile;
  frontend?: {
    api?: GeneratedFile;
    views?: GeneratedFile[];
    components?: GeneratedFile[];
  };
  menu?: GeneratedFile;
}

export class CodeGenerator {
  private projectStructure: ProjectStructure;

  constructor(projectStructure: ProjectStructure) {
    this.projectStructure = projectStructure;
  }

  /**
   * 从 AI 响应解析代码
   */
  parseCodeFromResponse(response: string): CodeGenerationResult {
    const result: CodeGenerationResult = {};

    // 解析代码块
    const codeBlocks = this.extractCodeBlocks(response);
    
    for (const block of codeBlocks) {
      const fileInfo = this.identifyFileType(block.filename || '', block.language || '', block.content);
      
      if (fileInfo.type === 'entity') {
        result.entity = { path: fileInfo.path, content: block.content };
      } else if (fileInfo.type === 'dto') {
        if (!result.dto) result.dto = [];
        result.dto.push({ path: fileInfo.path, content: block.content });
      } else if (fileInfo.type === 'service') {
        result.service = { path: fileInfo.path, content: block.content };
      } else if (fileInfo.type === 'controller') {
        result.controller = { path: fileInfo.path, content: block.content };
      } else if (fileInfo.type === 'module') {
        result.module = { path: fileInfo.path, content: block.content };
      } else if (fileInfo.type === 'frontend-api') {
        if (!result.frontend) result.frontend = {};
        result.frontend.api = { path: fileInfo.path, content: block.content };
      } else if (fileInfo.type === 'frontend-view') {
        if (!result.frontend) result.frontend = {};
        if (!result.frontend.views) result.frontend.views = [];
        result.frontend.views.push({ path: fileInfo.path, content: block.content });
      }
    }

    return result;
  }

  /**
   * 提取代码块
   */
  private extractCodeBlocks(content: string): Array<{ filename?: string; language?: string; content: string }> {
    const blocks: Array<{ filename?: string; language?: string; content: string }> = [];
    
    // 匹配 ```filename.ext 或 ```language 格式的代码块
    const regex = /```(?:(\w+\.(?:ts|tsx|js|jsx|vue|json))|(\w+))?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      blocks.push({
        filename: match[1],
        language: match[2],
        content: match[3].trim(),
      });
    }

    return blocks;
  }

  /**
   * 识别文件类型
   */
  private identifyFileType(filename: string, language: string, content: string): { type: string; path: string } {
    // 根据文件名判断
    if (filename.includes('.entity.')) {
      return { 
        type: 'entity', 
        path: path.join(this.projectStructure.backend?.entitiesPath || '', filename) 
      };
    }
    if (filename.includes('.dto.') || filename.includes('.dto/')) {
      return { 
        type: 'dto', 
        path: path.join(this.projectStructure.backend?.modulesPath || '', filename) 
      };
    }
    if (filename.includes('.service.')) {
      return { 
        type: 'service', 
        path: path.join(this.projectStructure.backend?.modulesPath || '', filename) 
      };
    }
    if (filename.includes('.controller.')) {
      return { 
        type: 'controller', 
        path: path.join(this.projectStructure.backend?.modulesPath || '', filename) 
      };
    }
    if (filename.includes('.module.')) {
      return { 
        type: 'module', 
        path: path.join(this.projectStructure.backend?.modulesPath || '', filename) 
      };
    }

    // 根据内容判断
    if (content.includes('@Entity(') || content.includes('extends BaseEntity')) {
      const entityName = this.extractClassName(content) || 'unknown';
      return { 
        type: 'entity', 
        path: path.join(this.projectStructure.backend?.entitiesPath || '', `sys-${entityName}.entity.ts`) 
      };
    }
    if (content.includes('@Controller(')) {
      return { type: 'controller', path: '' };
    }
    if (content.includes('@Injectable()') && content.includes('Service')) {
      return { type: 'service', path: '' };
    }

    return { type: 'unknown', path: '' };
  }

  /**
   * 提取类名
   */
  private extractClassName(content: string): string | null {
    const match = content.match(/class\s+(\w+)/);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * 生成文件路径
   */
  generateFilePaths(entityName: string, features: string[]): CodeGenerationResult {
    const backend = this.projectStructure.backend;
    const frontend = this.projectStructure.frontend;
    
    if (!backend) return {};

    const moduleName = entityName.toLowerCase();
    const entityClassName = this.toPascalCase(entityName);
    
    const modulePath = path.join(backend.modulesPath, moduleName);

    const result: CodeGenerationResult = {
      entity: {
        path: path.join(backend.entitiesPath, `sys-${moduleName}.entity.ts`),
        content: '',
      },
      dto: [
        { path: path.join(modulePath, 'dto', `create-${moduleName}.dto.ts`), content: '' },
        { path: path.join(modulePath, 'dto', `update-${moduleName}.dto.ts`), content: '' },
        { path: path.join(modulePath, 'dto', `query-${moduleName}.dto.ts`), content: '' },
      ],
      service: {
        path: path.join(modulePath, `${moduleName}.service.ts`),
        content: '',
      },
      controller: {
        path: path.join(modulePath, `${moduleName}.controller.ts`),
        content: '',
      },
      module: {
        path: path.join(modulePath, `${moduleName}.module.ts`),
        content: '',
      },
    };

    if (frontend) {
      result.frontend = {
        api: {
          path: path.join(frontend.apiPath, `${moduleName}.ts`),
          content: '',
        },
        views: [
          { path: path.join(frontend.pagesPath, moduleName, 'index.vue'), content: '' },
          { path: path.join(frontend.pagesPath, moduleName, 'form.vue'), content: '' },
        ],
      };
    }

    return result;
  }

  /**
   * 写入文件
   */
  async writeFiles(result: CodeGenerationResult, dryRun: boolean = false): Promise<string[]> {
    const writtenFiles: string[] = [];

    const writeFile = async (file: GeneratedFile | undefined) => {
      if (!file || !file.content) return;
      
      if (dryRun) {
        writtenFiles.push(`[预览] ${file.path}`);
        return;
      }

      await fs.ensureDir(path.dirname(file.path));
      await fs.writeFile(file.path, file.content, 'utf-8');
      writtenFiles.push(file.path);
    };

    await writeFile(result.entity);
    await writeFile(result.service);
    await writeFile(result.controller);
    await writeFile(result.module);

    if (result.dto) {
      for (const dto of result.dto) {
        await writeFile(dto);
      }
    }

    if (result.frontend) {
      await writeFile(result.frontend.api);
      if (result.frontend.views) {
        for (const view of result.frontend.views) {
          await writeFile(view);
        }
      }
    }

    return writtenFiles;
  }

  /**
   * 更新 app.module.ts 注册新模块
   */
  async updateAppModule(moduleName: string, dryRun: boolean = false): Promise<boolean> {
    const backend = this.projectStructure.backend;
    if (!backend) return false;

    const appModulePath = path.join(backend.path, 'src', 'app.module.ts');
    if (!await fs.pathExists(appModulePath)) return false;

    let content = await fs.readFile(appModulePath, 'utf-8');
    const moduleClassName = this.toPascalCase(moduleName) + 'Module';
    const importPath = `./modules/${moduleName}/${moduleName}.module`;

    // 检查是否已导入
    if (content.includes(moduleClassName)) {
      return true;
    }

    // 添加导入
    const importStatement = `import { ${moduleClassName} } from '${importPath}';\n`;
    const lastImportIndex = content.lastIndexOf('import ');
    const lastImportEndIndex = content.indexOf('\n', lastImportIndex) + 1;
    content = content.slice(0, lastImportEndIndex) + importStatement + content.slice(lastImportEndIndex);

    // 添加到 imports 数组
    const importsMatch = content.match(/imports:\s*\[([\s\S]*?)\]/);
    if (importsMatch) {
      const importsArray = importsMatch[1];
      const newImportsArray = importsArray.trim().endsWith(',') 
        ? importsArray + `\n    ${moduleClassName},`
        : importsArray + `,\n    ${moduleClassName},`;
      content = content.replace(importsMatch[0], `imports: [${newImportsArray}]`);
    }

    if (dryRun) {
      return true;
    }

    await fs.writeFile(appModulePath, content, 'utf-8');
    return true;
  }

  /**
   * 生成菜单配置
   */
  generateMenuConfig(moduleName: string, entityName: string, features: string[]): any {
    const menuName = this.toPascalCase(entityName);
    
    return {
      name: `${moduleName}:manage`,
      path: `/${moduleName}`,
      component: `${moduleName}/index`,
      meta: {
        title: `${menuName}管理`,
        icon: 'list',
        permissions: [`${moduleName}:list`],
      },
      children: features.includes('create') ? [
        {
          name: `${moduleName}:create`,
          path: 'create',
          component: `${moduleName}/form`,
          meta: {
            title: `新增${menuName}`,
            hidden: true,
            permissions: [`${moduleName}:create`],
          },
        },
        {
          name: `${moduleName}:edit`,
          path: 'edit/:id',
          component: `${moduleName}/form`,
          meta: {
            title: `编辑${menuName}`,
            hidden: true,
            permissions: [`${moduleName}:update`],
          },
        },
      ] : [],
    };
  }

  /**
   * 转换为大驼峰命名
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, (_, char) => char.toUpperCase());
  }

  /**
   * 转换为小驼峰命名
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, (_, char) => char.toLowerCase());
  }
}
