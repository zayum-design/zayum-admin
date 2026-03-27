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
  database?: GeneratedFile[];
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
      } else if (fileInfo.type === 'database') {
        // 数据库迁移脚本
        if (!result.database) result.database = [];
        result.database.push({ path: fileInfo.path, content: block.content });
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
      let blockContent = match[3].trim();
      let filename = match[1];
      
      // 检查代码块内容中是否包含 // FILE: 注释（支持在任意位置）
      const fileCommentMatch = blockContent.match(/\/\/\s*FILE:\s*(.+?)(?:\n|$)/m);
      if (fileCommentMatch) {
        filename = fileCommentMatch[1].trim();
        // 从内容中移除 FILE 注释行
        blockContent = blockContent.replace(/\/\/\s*FILE:.+?(?:\n|$)/m, '').trim();
      }
      
      blocks.push({
        filename,
        language: match[2],
        content: blockContent,
      });
    }

    return blocks;
  }

  /**
   * 识别文件类型
   */
  private identifyFileType(filename: string, language: string, content: string): { type: string; path: string } {
    // 从完整路径中提取纯文件名（处理 AI 返回完整路径的情况）
    const pureFilename = filename ? path.basename(filename) : '';
    
    // 根据文件名判断
    if (filename.includes('.entity.')) {
      return { 
        type: 'entity', 
        path: path.join(this.projectStructure.backend?.entitiesPath || '', pureFilename) 
      };
    }
    if (filename.includes('.dto.') || filename.includes('.dto/')) {
      // DTO 文件需要保留子目录结构，如 dto/create-xxx.dto.ts
      const dtoMatch = filename.match(/dto[\/]([^/]+\.dto\.ts)$/);
      const dtoFilename = dtoMatch ? `dto/${dtoMatch[1]}` : pureFilename;
      const moduleMatch = filename.match(/modules\/([^/]+)/);
      const moduleName = moduleMatch ? moduleMatch[1] : '';
      const modulePath = moduleName 
        ? path.join(this.projectStructure.backend?.modulesPath || '', moduleName)
        : this.projectStructure.backend?.modulesPath || '';
      return { 
        type: 'dto', 
        path: path.join(modulePath, dtoFilename) 
      };
    }
    if (filename.includes('.service.')) {
      // 检查是否是前端服务文件
      if (filename.includes('frontend/') || filename.includes('src/services/')) {
        return { 
          type: 'frontend-api', 
          path: path.join(this.projectStructure.frontend?.apiPath || '', pureFilename) 
        };
      }
      
      // 后端服务文件
      const moduleMatch = filename.match(/modules\/([^/]+)/);
      const moduleName = moduleMatch ? moduleMatch[1] : '';
      const modulePath = moduleName 
        ? path.join(this.projectStructure.backend?.modulesPath || '', moduleName)
        : this.projectStructure.backend?.modulesPath || '';
      return { 
        type: 'service', 
        path: path.join(modulePath, pureFilename) 
      };
    }
    if (filename.includes('.controller.')) {
      const moduleMatch = filename.match(/modules\/([^/]+)/);
      const moduleName = moduleMatch ? moduleMatch[1] : '';
      const modulePath = moduleName 
        ? path.join(this.projectStructure.backend?.modulesPath || '', moduleName)
        : this.projectStructure.backend?.modulesPath || '';
      return { 
        type: 'controller', 
        path: path.join(modulePath, pureFilename) 
      };
    }
    if (filename.includes('.module.')) {
      const moduleMatch = filename.match(/modules\/([^/]+)/);
      const moduleName = moduleMatch ? moduleMatch[1] : '';
      const modulePath = moduleName 
        ? path.join(this.projectStructure.backend?.modulesPath || '', moduleName)
        : this.projectStructure.backend?.modulesPath || '';
      return { 
        type: 'module', 
        path: path.join(modulePath, pureFilename) 
      };
    }
    
    // 数据库迁移脚本识别
    if (filename.includes('.sql') || filename.includes('add_') && (filename.includes('_table') || filename.includes('_fields'))) {
      // 提取模块名 - 匹配 add_xxx_yyy_zzz_table.sql 或 add_xxx_yyy_fields.sql
      const sqlMatch = filename.match(/add_([^_]+(?:_[^_]+)*?)_(?:table|fields)\.sql$/);
      if (sqlMatch) {
        const moduleName = sqlMatch[1];
        const databasePath = this.projectStructure.backend?.databasePath || '';
        return { 
          type: 'database', 
          path: path.join(databasePath, pureFilename) 
        };
      }
      // 如果文件名包含完整路径
      if (filename.includes('database/')) {
        const databasePath = this.projectStructure.backend?.databasePath || '';
        return { 
          type: 'database', 
          path: path.join(databasePath, pureFilename) 
        };
      }
    }
    
    // 前端页面文件识别
    if (filename.includes('.tsx') || filename.includes('.vue')) {
      // 检查是否是前端页面文件
      if (filename.includes('frontend/') || filename.includes('src/pages/') || filename.includes('pages/')) {
        // 提取模块名和文件名
        const pageMatch = filename.match(/(?:pages|src\/pages)\/([^/]+)\/([^/]+\.(?:tsx|vue))$/);
        if (pageMatch) {
          const moduleName = pageMatch[1];
          const pageFilename = pageMatch[2];
          const pagePath = path.join(this.projectStructure.frontend?.pagesPath || '', moduleName, pageFilename);
          return { 
            type: 'frontend-view', 
            path: pagePath 
          };
        }
      }
    }

    // 根据内容判断
    if (content.includes('@Entity(') || content.includes('extends BaseEntity')) {
      const className = this.extractClassName(content) || 'unknown';
      // 提取基础名称并转换为短横线格式
      const baseName = this.extractEntityBaseName(className);
      const kebabName = this.toKebabCase(baseName);
      return { 
        type: 'entity', 
        path: path.join(this.projectStructure.backend?.entitiesPath || '', `sys-${kebabName}.entity.ts`) 
      };
    }
    if (content.includes('@Controller(')) {
      return { type: 'controller', path: '' };
    }
    if (content.includes('@Injectable()') && content.includes('Service')) {
      return { type: 'service', path: '' };
    }
    // 根据SQL内容判断
    if (content.includes('CREATE TABLE') || content.includes('CREATE INDEX') || content.includes('COMMENT ON')) {
      // 尝试从内容中提取表名
      const tableMatch = content.match(/CREATE TABLE\s+"?([^"\s]+)"?/);
      if (tableMatch) {
        const tableName = tableMatch[1];
        // 从表名提取模块名（sys_user_score -> user-score）
        const moduleName = tableName.replace(/^sys_/, '').replace(/_/g, '-');
        const databasePath = this.projectStructure.backend?.databasePath || '';
        return { 
          type: 'database', 
          path: path.join(databasePath, `add_${moduleName}_table.sql`) 
        };
      }
    }

    return { type: 'unknown', path: '' };
  }

  /**
   * 提取类名
   */
  private extractClassName(content: string): string | null {
    const match = content.match(/class\s+(\w+)/);
    return match ? match[1] : null;
  }

  /**
   * 提取实体基础名称（去除 Sys 前缀和 Entity 后缀）
   */
  private extractEntityBaseName(className: string): string {
    return className
      .replace(/^Sys/, '')  // 去除 Sys 前缀
      .replace(/Entity$/, '')  // 去除 Entity 后缀
      .replace(/^(.)/, (_, char) => char.toLowerCase());  // 首字母小写
  }

  /**
   * 转换为短横线连接命名 (kebab-case)
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')  // 在小写和大写之间加横线
      .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')  // 处理连续大写
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/^-/, '');  // 移除开头的横线
  }

  /**
   * 生成文件路径
   */
  generateFilePaths(entityName: string, features: string[]): CodeGenerationResult {
    const backend = this.projectStructure.backend;
    const frontend = this.projectStructure.frontend;
    
    if (!backend) return {};

    // entityName 可能是 "userScore" 或 "UserScore" 或 "sys-user-score"
    // 统一转换为短横线连接格式
    const kebabName = this.toKebabCase(entityName.replace(/^sys-/, ''));
    const moduleName = kebabName;  // user-score
    const entityClassName = 'Sys' + this.toPascalCase(moduleName);  // SysUserScore
    
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
      if (!file) {
        return;
      }
      
      // 跳过无效路径
      if (!file.path || file.path.trim() === '') {
        console.warn('跳过无效文件路径');
        return;
      }
      
      if (dryRun) {
        writtenFiles.push(`[预览] ${file.path}`);
        return;
      }
      
      // 实际保存时需要内容
      if (!file.content) {
        console.warn(`跳过空内容文件: ${file.path}`);
        return;
      }

      await fs.ensureDir(path.dirname(file.path));
      await fs.writeFile(file.path, file.content, 'utf-8');
      writtenFiles.push(file.path);
    };

    // 保存数据库迁移脚本
    if (result.database) {
      for (const dbFile of result.database) {
        await writeFile(dbFile);
      }
    }

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
    const importStatement = `import { ${moduleClassName} } from '${importPath}';
`;
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
