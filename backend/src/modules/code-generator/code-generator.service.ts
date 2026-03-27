import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as fs from 'fs-extra';
import * as path from 'path';
import { GetTablesDto } from './dto/get-tables.dto';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { DownloadCodeDto } from './dto/download-code.dto';
import { CreateMenuDto } from './dto/create-menu.dto';
import { CreateTableDto, CreateTableFieldDto } from './dto/create-table.dto';

interface TableInfo {
  tableName: string;
  tableComment?: string;
}

interface ColumnInfo {
  columnName: string;
  dataType: string;
  columnComment?: string;
  isNullable: boolean;
  columnDefault?: string;
  characterMaximumLength?: number;
  numericPrecision?: number;
  numericScale?: number;
  isPrimaryKey: boolean;
}

interface GeneratedFile {
  name: string;
  path: string;
  language: string;
  code: string;
}

@Injectable()
export class CodeGeneratorService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) { }

  // 获取所有表
  async getTables(query: GetTablesDto): Promise<TableInfo[]> {
    const { keyword } = query;

    let sql = `
      SELECT 
        table_name as "tableName",
        obj_description((table_schema || '.' || table_name)::regclass, 'pg_class') as "tableComment"
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;

    if (keyword) {
      sql += ` AND table_name LIKE '%${keyword}%'`;
    }

    sql += ` ORDER BY table_name`;

    const result = await this.dataSource.query(sql);
    return result;
  }

  // 获取表的列信息
  async getColumns(tableName: string): Promise<ColumnInfo[]> {
    const sql = `
      SELECT 
        c.column_name as "columnName",
        c.data_type as "dataType",
        col_description(pgc.oid, c.ordinal_position) as "columnComment",
        c.is_nullable = 'YES' as "isNullable",
        c.column_default as "columnDefault",
        c.character_maximum_length as "characterMaximumLength",
        c.numeric_precision as "numericPrecision",
        c.numeric_scale as "numericScale",
        EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
          WHERE tc.table_name = c.table_name 
            AND tc.constraint_type = 'PRIMARY KEY'
            AND ccu.column_name = c.column_name
        ) as "isPrimaryKey"
      FROM information_schema.columns c
      JOIN pg_class pgc ON pgc.relname = c.table_name
      WHERE c.table_schema = 'public' 
      AND c.table_name = $1
      ORDER BY c.ordinal_position
    `;

    const result = await this.dataSource.query(sql, [tableName]);
    return result;
  }

  // 生成代码
  async generateCode(dto: GenerateCodeDto): Promise<GeneratedFile[]> {
    const { tableName, columns } = dto;

    // 获取所有列信息
    const allColumns = await this.getColumns(tableName);
    const selectedColumns = allColumns.filter(col => columns.includes(col.columnName));

    // 获取主键列
    const primaryKey = allColumns.find(col => col.isPrimaryKey);
    const primaryKeyName = primaryKey?.columnName || 'id';

    // 提取无前缀的模块名（如 sys_user -> user）
    const moduleName = this.getModuleName(tableName);
    
    // 转换表名为各种命名格式
    const entityName = this.toPascalCase(tableName);      // SysUser
    const camelName = this.toCamelCase(tableName);        // sysUser
    const entityFileName = tableName.replace(/_/g, '-');  // sys-user（Entity文件名保留完整表名）
    const moduleKebabName = moduleName.replace(/_/g, '-'); // user（模块文件夹名无前缀）
    const moduleCamelName = this.toCamelCase(moduleName);  // user（模块驼峰名无前缀）

    const files: GeneratedFile[] = [];

    // 1. 生成 Entity (使用所有字段) - 文件名保留完整表名如 sys-user.entity.ts
    files.push({
      name: `${entityFileName}.entity.ts`,
      path: `backend/src/entities/${entityFileName}.entity.ts`,
      language: 'typescript',
      code: this.generateEntity(entityName, tableName, allColumns),
    });

    // 2. 生成 DTO - Create (使用所有字段，排除主键和系统字段)
    files.push({
      name: `create-${moduleKebabName}.dto.ts`,
      path: `backend/src/modules/${moduleKebabName}/dto/create-${moduleKebabName}.dto.ts`,
      language: 'typescript',
      code: this.generateCreateDto(entityName, allColumns),
    });

    // 3. 生成 DTO - Update (使用所有字段，排除主键和系统字段)
    files.push({
      name: `update-${moduleKebabName}.dto.ts`,
      path: `backend/src/modules/${moduleKebabName}/dto/update-${moduleKebabName}.dto.ts`,
      language: 'typescript',
      code: this.generateUpdateDto(entityName, allColumns),
    });

    // 4. 生成 DTO - Query (使用所有字段)
    files.push({
      name: `query-${moduleKebabName}.dto.ts`,
      path: `backend/src/modules/${moduleKebabName}/dto/query-${moduleKebabName}.dto.ts`,
      language: 'typescript',
      code: this.generateQueryDto(entityName, allColumns),
    });

    // 5. 生成 Service (使用所有字段)
    files.push({
      name: `${moduleKebabName}.service.ts`,
      path: `backend/src/modules/${moduleKebabName}/${moduleKebabName}.service.ts`,
      language: 'typescript',
      code: this.generateService(entityName, moduleKebabName, moduleCamelName, entityFileName, allColumns, primaryKeyName),
    });

    // 6. 生成 Controller
    files.push({
      name: `${moduleKebabName}.controller.ts`,
      path: `backend/src/modules/${moduleKebabName}/${moduleKebabName}.controller.ts`,
      language: 'typescript',
      code: this.generateController(entityName, moduleKebabName, moduleCamelName, primaryKeyName),
    });

    // 7. 生成 Module
    files.push({
      name: `${moduleKebabName}.module.ts`,
      path: `backend/src/modules/${moduleKebabName}/${moduleKebabName}.module.ts`,
      language: 'typescript',
      code: this.generateModule(entityName, moduleKebabName, entityFileName),
    });

    // 8. 生成前端页面 (列表使用选中的字段，表单使用所有字段)
    files.push({
      name: 'index.tsx',
      path: `frontend/src/pages/${moduleKebabName}/index.tsx`,
      language: 'typescript',
      code: this.generateFrontendPage(entityName, moduleKebabName, moduleCamelName, allColumns, selectedColumns),
    });

    // 9. 生成前端服务
    files.push({
      name: `${moduleKebabName}.service.ts`,
      path: `frontend/src/services/${moduleKebabName}.service.ts`,
      language: 'typescript',
      code: this.generateFrontendService(moduleKebabName, moduleCamelName, entityName),
    });

    return files;
  }

  // 辅助方法：提取模块名（去掉常见前缀如 sys_）
  private getModuleName(tableName: string): string {
    // 常见前缀列表
    const commonPrefixes = ['sys_', 't_', 'tb_', 'table_'];
    
    for (const prefix of commonPrefixes) {
      if (tableName.toLowerCase().startsWith(prefix)) {
        return tableName.slice(prefix.length);
      }
    }
    
    return tableName;
  }

  // 辅助方法：转换为驼峰命名
  private toCamelCase(str: string): string {
    return str
      .split(/[-_]/)           // 按 - 或 _ 分割
      .filter(Boolean)         // 过滤空字符串
      .map((word, index) => 
        index === 0 
          ? word.toLowerCase() 
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join('');
  }

  // 辅助方法：转换为 PascalCase
  private toPascalCase(str: string): string {
    // 按连字符和下划线分割，过滤空字符串，首字母大写后拼接
    return str
      .split(/[-_]/)           // 按 - 或 _ 分割
      .filter(Boolean)         // 过滤空字符串
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');               // 用空字符串连接（不要用连字符）
  }

  // 辅助方法：数据库类型转换为 TypeScript 类型
  private dbTypeToTsType(dbType: string): string {
    const typeMap: Record<string, string> = {
      'character varying': 'string',
      'varchar': 'string',
      'text': 'string',
      'integer': 'number',
      'bigint': 'number',
      'smallint': 'number',
      'decimal': 'number',
      'numeric': 'number',
      'real': 'number',
      'double precision': 'number',
      'boolean': 'boolean',
      'timestamp without time zone': 'Date',
      'timestamp with time zone': 'Date',
      'date': 'Date',
      'time': 'string',
      'uuid': 'string',
      'json': 'object',
      'jsonb': 'object',
    };
    return typeMap[dbType.toLowerCase()] || 'string';
  }

  // 生成 Entity (TypeORM 实体类)
  private generateEntity(entityName: string, tableName: string, columns: ColumnInfo[]): string {
    const fields = columns.map(col => {
      const decorators: string[] = [];
      const tsType = this.dbTypeToTsType(col.dataType);
      const dbType = this.mapDbTypeToTypeOrm(col.dataType);

      // 主键
      if (col.isPrimaryKey) {
        decorators.push('  @PrimaryGeneratedColumn()');
      } else {
        // 普通列
        const columnOptions: string[] = [];
        if (dbType) {
          columnOptions.push(`type: '${dbType}'`);
        }
        if (!col.isNullable) {
          columnOptions.push('nullable: false');
        }
        // 添加注释到 Column 装饰器中
        if (col.columnComment) {
          columnOptions.push(`comment: '${col.columnComment.replace(/'/g, "\\'")}'`);
        }
        
        if (columnOptions.length > 0) {
          decorators.push(`  @Column({ ${columnOptions.join(', ')} })`);
        } else {
          decorators.push('  @Column()');
        }
      }

      return `${decorators.join('\n')}\n  ${col.columnName}: ${tsType};`;
    }).join('\n\n');

    return `import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('${tableName}')
export class ${entityName} {
${fields}
}`;
  }

  // 数据库类型映射到 TypeORM 类型
  private mapDbTypeToTypeOrm(dbType: string): string | null {
    const typeMap: Record<string, string> = {
      'character varying': 'varchar',
      'varchar': 'varchar',
      'text': 'text',
      'integer': 'int',
      'bigint': 'bigint',
      'smallint': 'smallint',
      'decimal': 'decimal',
      'numeric': 'decimal',
      'boolean': 'bool',
      'timestamp without time zone': 'timestamp',
      'timestamp with time zone': 'timestamptz',
      'date': 'date',
      'time': 'time',
      'uuid': 'uuid',
      'json': 'json',
      'jsonb': 'jsonb',
    };
    return typeMap[dbType.toLowerCase()] || null;
  }

  // 生成 Create DTO
  private generateCreateDto(entityName: string, columns: ColumnInfo[]): string {
    const fields = columns
      .filter(col => !col.isPrimaryKey && col.columnName !== 'created_at' && col.columnName !== 'updated_at')
      .map(col => {
        const tsType = this.dbTypeToTsType(col.dataType);
        const decorators: string[] = [];
        
        // 根据类型选择验证装饰器
        if (!col.isNullable) {
          decorators.push('  @IsNotEmpty()');
        } else {
          decorators.push('  @IsOptional()');
        }
        
        if (tsType === 'string') {
          decorators.push('  @IsString()');
        } else if (tsType === 'number') {
          decorators.push('  @IsNumber()');
        } else if (tsType === 'boolean') {
          decorators.push('  @IsBoolean()');
        } else if (tsType === 'Date') {
          decorators.push('  @IsDate()');
        }
        
        return `${decorators.join('\n')}\n  ${col.columnName}${col.isNullable ? '?' : ''}: ${tsType};`;
      }).join('\n\n');

    return `import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsDate } from 'class-validator';

export class Create${entityName}Dto {
${fields}
}`;
  }

  // 生成 Update DTO
  private generateUpdateDto(entityName: string, columns: ColumnInfo[]): string {
    const fields = columns
      .filter(col => !col.isPrimaryKey && col.columnName !== 'created_at' && col.columnName !== 'updated_at')
      .map(col => {
        const tsType = this.dbTypeToTsType(col.dataType);
        const decorators: string[] = ['  @IsOptional()'];
        
        if (tsType === 'string') {
          decorators.push('  @IsString()');
        } else if (tsType === 'number') {
          decorators.push('  @IsNumber()');
        } else if (tsType === 'boolean') {
          decorators.push('  @IsBoolean()');
        } else if (tsType === 'Date') {
          decorators.push('  @IsDate()');
        }
        
        return `${decorators.join('\n')}\n  ${col.columnName}?: ${tsType};`;
      }).join('\n\n');

    return `import { IsOptional, IsString, IsNumber, IsBoolean, IsDate } from 'class-validator';

export class Update${entityName}Dto {
${fields}
}`;
  }

  // 生成 Query DTO
  private generateQueryDto(entityName: string, columns: ColumnInfo[]): string {
    const searchableColumns = columns.filter(col => {
      const tsType = this.dbTypeToTsType(col.dataType);
      return tsType === 'string';
    });

    const fields = searchableColumns.map(col => {
      return `  @IsOptional()\n  @IsString()\n  ${col.columnName}?: string;`;
    }).join('\n\n');

    return `import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class Query${entityName}Dto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number = 10;${fields ? '\n\n' + fields : ''}
}`;
  }

  // 生成 Service
  private generateService(
    entityName: string,
    moduleKebabName: string,
    moduleCamelName: string,
    entityFileName: string,
    columns: ColumnInfo[],
    primaryKey: string
  ): string {
    const pascalName = entityName;

    return `import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ${pascalName} } from '../../entities/${entityFileName}.entity';
import { Create${pascalName}Dto } from './dto/create-${moduleKebabName}.dto';
import { Update${pascalName}Dto } from './dto/update-${moduleKebabName}.dto';
import { Query${pascalName}Dto } from './dto/query-${moduleKebabName}.dto';

@Injectable()
export class ${pascalName}Service {
  constructor(
    @InjectRepository(${pascalName})
    private ${moduleCamelName}Repository: Repository<${pascalName}>,
  ) {}

  async findAll(query: Query${pascalName}Dto) {
    const { page = 1, pageSize = 10 } = query;
    
    const where: any = {};
    
    // TODO: 添加查询条件
    
    const [list, total] = await this.${moduleCamelName}Repository.findAndCount({
      where,
      order: { ${primaryKey}: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(${primaryKey}: number) {
    const item = await this.${moduleCamelName}Repository.findOne({ where: { ${primaryKey} } });
    if (!item) {
      throw new NotFoundException('记录不存在');
    }
    return item;
  }

  async create(createDto: Create${pascalName}Dto) {
    const item = this.${moduleCamelName}Repository.create(createDto);
    return this.${moduleCamelName}Repository.save(item);
  }

  async update(${primaryKey}: number, updateDto: Update${pascalName}Dto) {
    const item = await this.findOne(${primaryKey});
    Object.assign(item, updateDto);
    return this.${moduleCamelName}Repository.save(item);
  }

  async remove(${primaryKey}: number) {
    const item = await this.findOne(${primaryKey});
    await this.${moduleCamelName}Repository.remove(item);
    return { message: '删除成功' };
  }
}`;
  }

  // 生成 Controller
  private generateController(entityName: string, moduleKebabName: string, moduleCamelName: string, primaryKey: string): string {
    const pascalName = entityName;

    return `import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ${pascalName}Service } from './${moduleKebabName}.service';
import { Create${pascalName}Dto } from './dto/create-${moduleKebabName}.dto';
import { Update${pascalName}Dto } from './dto/update-${moduleKebabName}.dto';
import { Query${pascalName}Dto } from './dto/query-${moduleKebabName}.dto';

@Controller('api/admin/${moduleKebabName.replace(/-/g, '/')}')
export class ${pascalName}Controller {
  constructor(private readonly ${moduleCamelName}Service: ${pascalName}Service) {}

  @Get()
  async findAll(@Query() query: Query${pascalName}Dto) {
    return this.${moduleCamelName}Service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.${moduleCamelName}Service.findOne(id);
  }

  @Post()
  async create(@Body() createDto: Create${pascalName}Dto) {
    return this.${moduleCamelName}Service.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Update${pascalName}Dto,
  ) {
    return this.${moduleCamelName}Service.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.${moduleCamelName}Service.remove(id);
  }
}`;
  }

  // 生成 Module
  private generateModule(entityName: string, moduleKebabName: string, entityFileName: string): string {
    const pascalName = entityName;

    return `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${pascalName}Service } from './${moduleKebabName}.service';
import { ${pascalName}Controller } from './${moduleKebabName}.controller';
import { ${pascalName} } from '../../entities/${entityFileName}.entity';

@Module({
  imports: [TypeOrmModule.forFeature([${pascalName}])],
  controllers: [${pascalName}Controller],
  providers: [${pascalName}Service],
})
export class ${pascalName}Module {}`;
  }

  // 生成前端页面
  private generateFrontendPage(
    entityName: string,
    moduleKebabName: string,
    moduleCamelName: string,
    allColumns: ColumnInfo[],
    selectedColumns: ColumnInfo[]
  ): string {
    const pascalName = entityName;
    // 列表只显示选中的字段（排除主键）
    const displayColumns = selectedColumns.filter(col => !col.isPrimaryKey);
    // 表单使用所有字段（排除主键和系统字段）
    const formColumns = allColumns.filter(col => !col.isPrimaryKey && col.columnName !== 'created_at' && col.columnName !== 'updated_at');

    const columnsConfig = displayColumns.map(col => `    {
      title: '${col.columnComment || col.columnName}',
      dataIndex: '${col.columnName}',
      key: '${col.columnName}',
    },`).join('\n');

    const formItems = formColumns.map(col => {
      const tsType = this.dbTypeToTsType(col.dataType);
      if (tsType === 'boolean') {
        return `        <Form.Item name="${col.columnName}" label="${col.columnComment || col.columnName}" valuePropName="checked">
          <Switch />
        </Form.Item>`;
      }
      return `        <Form.Item name="${col.columnName}" label="${col.columnComment || col.columnName}">
          <Input />
        </Form.Item>`;
    }).join('\n');

    return `import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ${moduleCamelName}Service } from '../../services/${moduleKebabName}.service';
import type { ${pascalName}Item, Create${pascalName}Dto, Update${pascalName}Dto } from '../../services/${moduleKebabName}.service';

export default function ${pascalName}Management() {
  const [data, setData] = useState<${pascalName}Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<${pascalName}Item | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await ${moduleCamelName}Service.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      if (response.data) {
        setData(response.data.list);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
        }));
      }
    } catch (error) {
      message.error('获取列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: ${pascalName}Item) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await ${moduleCamelName}Service.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await ${moduleCamelName}Service.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await ${moduleCamelName}Service.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error?.message || '操作失败');
    }
  };

  const columns: ColumnsType<${pascalName}Item> = [
${columnsConfig}
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ${pascalName}Item) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <Button type="primary" onClick={handleCreate}>
          新增
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => \`共 \${total} 条\`,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize: pageSize || 10, total: pagination.total });
          },
        }}
      />

      <Modal
        title={editingItem ? '编辑' : '新增'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
${formItems}
        </Form>
      </Modal>
    </div>
  );
}`;
  }

  // 生成前端服务
  private generateFrontendService(moduleKebabName: string, moduleCamelName: string, entityName: string): string {
    const pascalName = entityName;

    return `import request from './request';

export interface Create${pascalName}Dto {
  // TODO: 添加创建字段
}

export interface Update${pascalName}Dto {
  // TODO: 添加更新字段
}

export interface Query${pascalName}Dto {
  page?: number;
  pageSize?: number;
}

export interface ${pascalName}Item {
  id: number;
  // TODO: 添加其他字段
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListResponse {
  code: number;
  message: string;
  data: {
    list: ${pascalName}Item[];
    pagination: Pagination;
  };
}

export interface DetailResponse {
  code: number;
  message: string;
  data: ${pascalName}Item;
}

export const ${moduleCamelName}Service = {
  getList: async (params: Query${pascalName}Dto) => {
    return request.get<any, ListResponse>('/api/admin/${moduleKebabName.replace(/-/g, '/')}', { params });
  },

  getDetail: async (id: number) => {
    return request.get<any, DetailResponse>(\`/api/admin/${moduleKebabName.replace(/-/g, '/')}/\${id}\`);
  },

  create: async (data: Create${pascalName}Dto) => {
    return request.post<Create${pascalName}Dto, any>('/api/admin/${moduleKebabName.replace(/-/g, '/')}', data);
  },

  update: async (id: number, data: Update${pascalName}Dto) => {
    return request.put<Update${pascalName}Dto, any>(\`/api/admin/${moduleKebabName.replace(/-/g, '/')}/\${id}\`, data);
  },

  delete: async (id: number) => {
    return request.delete<any, { code: number; message: string }>(\`/api/admin/${moduleKebabName.replace(/-/g, '/')}/\${id}\`);
  },
};`;
  }

  // 下载代码并写入文件
  async downloadCode(dto: DownloadCodeDto): Promise<{ files: string[]; success: boolean; message: string }> {
    const { tableName, columns, writeFiles = false } = dto;

    console.log('[CodeGenerator] downloadCode called:', { tableName, columnsCount: columns?.length, writeFiles });

    // 生成代码
    const files = await this.generateCode({ tableName, columns });
    console.log('[CodeGenerator] generated files:', files.map(f => f.path));

    if (!writeFiles) {
      console.log('[CodeGenerator] preview mode, skipping file write');
      return {
        files: files.map(f => f.path),
        success: true,
        message: '代码生成成功（预览模式，未写入文件）',
      };
    }

    const writtenFiles: string[] = [];
    const failedFiles: string[] = [];

    // 项目根目录（从 backend 目录向上一级到项目根目录）
    const rootDir = path.resolve(process.cwd(), '..');
    console.log('[CodeGenerator] rootDir corrected:', rootDir);
    console.log('[CodeGenerator] current cwd:', process.cwd());

    for (const file of files) {
      try {
        // 解析路径
        const filePath = file.path;
        let fullPath: string;

        if (filePath.startsWith('backend/')) {
          fullPath = path.join(rootDir, 'backend', 'src', filePath.replace('backend/src/', ''));
        } else if (filePath.startsWith('frontend/')) {
          fullPath = path.join(rootDir, 'frontend', 'src', filePath.replace('frontend/src/', ''));
        } else {
          fullPath = path.join(rootDir, filePath);
        }

        console.log('[CodeGenerator] writing file:', { filePath, fullPath });

        // 确保目录存在
        await fs.ensureDir(path.dirname(fullPath));

        // 写入文件
        await fs.writeFile(fullPath, file.code, 'utf-8');
        writtenFiles.push(filePath);
        console.log('[CodeGenerator] file written successfully:', fullPath);
      } catch (error) {
        console.error('[CodeGenerator] failed to write file:', file.path, error.message);
        failedFiles.push(`${file.path}: ${error.message}`);
      }
    }

    // 自动注册前端路由和后端模块
    const autoRegisterResults: string[] = [];

    if (writtenFiles.length > 0) {
      // 使用无前缀的模块名进行注册
      const moduleName = this.getModuleName(tableName);
      const moduleKebabName = moduleName.replace(/_/g, '-');
      const entityName = this.toPascalCase(tableName);

      try {
        // 1. 自动更新前端 App.tsx 添加路由
        const appTsxPath = path.join(rootDir, 'frontend', 'src', 'App.tsx');
        if (await fs.pathExists(appTsxPath)) {
          const appUpdated = await this.updateFrontendRoutes(appTsxPath, entityName, moduleKebabName);
          if (appUpdated) {
            autoRegisterResults.push('前端路由已自动注册到 App.tsx');
          }
        }
      } catch (error) {
        autoRegisterResults.push(`前端路由注册失败: ${error.message}`);
      }

      try {
        // 2. 自动更新后端 app.module.ts 注册模块
        const appModulePath = path.join(rootDir, 'backend', 'src', 'app.module.ts');
        if (await fs.pathExists(appModulePath)) {
          const moduleUpdated = await this.updateBackendModule(appModulePath, entityName, moduleKebabName);
          if (moduleUpdated) {
            autoRegisterResults.push('后端模块已自动注册到 app.module.ts');
          }
        }
      } catch (error) {
        autoRegisterResults.push(`后端模块注册失败: ${error.message}`);
      }
    }

    const autoRegisterMsg = autoRegisterResults.length > 0
      ? `；自动注册: ${autoRegisterResults.join(', ')}`
      : '';

    return {
      files: writtenFiles,
      success: failedFiles.length === 0,
      message: failedFiles.length === 0
        ? `成功写入 ${writtenFiles.length} 个文件${autoRegisterMsg}`
        : `写入 ${writtenFiles.length} 个文件，失败 ${failedFiles.length} 个: ${failedFiles.join(', ')}`,
    };
  }

  /**
   * 自动更新前端 App.tsx 添加路由
   */
  private async updateFrontendRoutes(appTsxPath: string, entityName: string, kebabName: string): Promise<boolean> {
    let content = await fs.readFile(appTsxPath, 'utf-8');

    const pageComponentName = `${entityName}Page`;
    const importPath = `./pages/${kebabName}`;
    const importStatement = `import ${pageComponentName} from '${importPath}';`;
    const routePath = kebabName;
    const routeElement = `<Route path="${routePath}" element={<${pageComponentName} />} />`;

    // 检查是否已存在 import
    if (content.includes(importStatement)) {
      return false; // 已存在，不需要更新
    }

    // 1. 添加 import 语句（在最后一个 import 之后添加）
    const lastImportMatch = content.match(/import\s+.+\s+from\s+['"].+['"];?\n/g);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      content = content.replace(lastImport, lastImport + importStatement + '\n');
    }

    // 2. 添加路由到 /admin Route 的子路由中
    // 查找 </Route> 闭合标签（MainLayout Route 的结束标签）之前的位置
    // 匹配模式：在 path="code-generator" 或类似路由行之后的 </Route>
    const adminRouteCloseMatch = content.match(
      /(<Route\s+path="[\w-]+"\s+element={<\w+Page\s*\/>}\s*\/>\s*)(<\/Route>\s*<\/Routes>)/
    );

    if (adminRouteCloseMatch) {
      // 在最后一个子路由后、</Route> 闭合标签前添加新路由
      const insertPosition = adminRouteCloseMatch.index! + adminRouteCloseMatch[1].length;
      const beforeInsert = content.slice(0, insertPosition);
      const afterInsert = content.slice(insertPosition);
      const newRouteLine = `              <Route path="${routePath}" element={<${pageComponentName} />} />\n              `;
      content = beforeInsert + newRouteLine + afterInsert;
    } else {
      // 备选方案：查找最后一个 <Route path="..." element={...} /> 并在此后添加
      const lastRouteMatch = content.match(/<Route\s+path="[\w-/]+"\s+element={[^}]+}\s*\/>/g);
      if (lastRouteMatch) {
        const lastRoute = lastRouteMatch[lastRouteMatch.length - 1];
        content = content.replace(lastRoute, lastRoute + '\n              ' + routeElement);
      }
    }

    await fs.writeFile(appTsxPath, content, 'utf-8');
    return true;
  }

  /**
   * 自动更新后端 app.module.ts 注册模块
   */
  private async updateBackendModule(appModulePath: string, entityName: string, kebabName: string): Promise<boolean> {
    let content = await fs.readFile(appModulePath, 'utf-8');

    const moduleClassName = `${entityName}Module`;
    const importPath = `./modules/${kebabName}/${kebabName}.module`;
    const importStatement = `import { ${moduleClassName} } from '${importPath}';`;

    // 检查是否已存在 import
    if (content.includes(importStatement)) {
      // 检查是否已在 imports 数组中
      const importsArrayRegex = new RegExp(`imports:\s*\[[^\]]*${moduleClassName}`, 's');
      if (importsArrayRegex.test(content)) {
        return false; // 已完全注册，不需要更新
      }
    }

    // 1. 添加 import 语句（在最后一个 import 之后添加）
    if (!content.includes(importStatement)) {
      const lastImportMatch = content.match(/import\s+.+\s+from\s+['"].+['"];?\n/g);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        content = content.replace(lastImport, lastImport + importStatement + '\n');
      }
    }

    // 2. 添加到 @Module 装饰器的 imports 数组
    // 使用更简单的策略：找到 imports: [ 后的 CodeGeneratorModule，在其后添加新模块
    const importsPattern = /(imports:\s*\[[\s\S]*?)(CodeGeneratorModule,)(\s*\n)/;
    if (importsPattern.test(content)) {
      content = content.replace(
        importsPattern,
        `$1$2    ${moduleClassName},$3`
      );
    } else {
      // 备选策略：找到最后一个已知模块并添加
      const lastModulePattern = /(MemberModule,)(\s*\n)/;
      if (lastModulePattern.test(content)) {
        content = content.replace(
          lastModulePattern,
          `$1    ${moduleClassName},$2`
        );
      }
    }

    await fs.writeFile(appModulePath, content, 'utf-8');
    return true;
  }

  // 创建菜单
  async createMenu(dto: CreateMenuDto): Promise<{ menuId: number; message: string }> {
    const { tableName, menuName, parentCode = 'system', sort = 0 } = dto;

    // 转换表名为代码
    const menuCode = tableName.replace(/_/g, '-');
    const path = `/admin/${menuCode}`;

    // 检查菜单是否已存在
    const existingMenu = await this.dataSource.query(
      'SELECT id FROM sys_permission WHERE code = $1',
      [menuCode]
    );

    if (existingMenu.length > 0) {
      throw new BadRequestException('菜单已存在');
    }

    // 查找父菜单ID
    let parentId = 0;
    if (parentCode) {
      const parentMenu = await this.dataSource.query(
        'SELECT id FROM sys_permission WHERE code = $1 AND type = $2',
        [parentCode, 'menu']
      );
      if (parentMenu.length > 0) {
        parentId = parentMenu[0].id;
      }
    }

    // 插入菜单
    const result = await this.dataSource.query(
      `INSERT INTO sys_permission 
       (parent_id, name, code, type, path, icon, sort, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id`,
      [parentId, menuName, menuCode, 'menu', path, 'FileTextOutlined', sort, 'normal']
    );

    const menuId = result[0].id;

    // 添加按钮权限
    const buttonPermissions = [
      { name: `新增${menuName}`, code: `${menuCode}:create`, sort: 0 },
      { name: `编辑${menuName}`, code: `${menuCode}:edit`, sort: 1 },
      { name: `删除${menuName}`, code: `${menuCode}:delete`, sort: 2 },
    ];

    for (const btn of buttonPermissions) {
      await this.dataSource.query(
        `INSERT INTO sys_permission 
         (parent_id, name, code, type, sort, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [menuId, btn.name, btn.code, 'button', btn.sort, 'normal']
      );
    }

    return {
      menuId,
      message: `菜单 "${menuName}" 创建成功，包含 ${buttonPermissions.length} 个按钮权限`,
    };
  }

  // 检查表是否存在
  async checkTableExists(tableName: string): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    `;
    const result = await this.dataSource.query(sql, [tableName]);
    return parseInt(result[0].count, 10) > 0;
  }

  // 创建数据表
  async createTable(dto: CreateTableDto): Promise<{ tableName: string; message: string }> {
    const { tableName, tableComment, fields } = dto;

    // 检查表名是否已存在
    const exists = await this.checkTableExists(tableName);
    if (exists) {
      throw new ConflictException(`表 "${tableName}" 已存在`);
    }

    // 检查至少有一个字段
    if (!fields || fields.length === 0) {
      throw new BadRequestException('至少需要定义一个字段');
    }

    // 检查是否有主键
    const hasPrimaryKey = fields.some(f => f.isPrimaryKey);
    if (!hasPrimaryKey) {
      throw new BadRequestException('必须指定一个主键字段');
    }

    // 构建建表SQL
    const fieldDefinitions: string[] = [];
    const comments: string[] = [];

    for (const field of fields) {
      const fieldDef = this.buildFieldDefinition(field);
      fieldDefinitions.push(fieldDef);

      // 添加字段注释
      if (field.comment) {
        comments.push(`COMMENT ON COLUMN ${tableName}.${field.name} IS '${field.comment.replace(/'/g, "''")}';`);
      }
    }

    // 组装SQL
    const createTableSql = `
      CREATE TABLE ${tableName} (
        ${fieldDefinitions.join(',\n        ')}
      )
    `;

    // 执行建表
    await this.dataSource.query(createTableSql);

    // 添加表注释
    if (tableComment) {
      const tableCommentSql = `COMMENT ON TABLE ${tableName} IS '${tableComment.replace(/'/g, "''")}'`;
      await this.dataSource.query(tableCommentSql);
    }

    // 添加字段注释
    for (const commentSql of comments) {
      await this.dataSource.query(commentSql);
    }

    return {
      tableName,
      message: `表 "${tableName}" 创建成功，共 ${fields.length} 个字段`,
    };
  }

  // 构建字段定义
  private buildFieldDefinition(field: CreateTableFieldDto): string {
    const { name, type, isNullable = true, isPrimaryKey = false } = field;

    let typeDef: string;

    switch (type.toLowerCase()) {
      case 'varchar':
      case 'string':
        typeDef = 'VARCHAR(255)';
        break;
      case 'text':
        typeDef = 'TEXT';
        break;
      case 'int':
      case 'integer':
        typeDef = 'INTEGER';
        break;
      case 'bigint':
        typeDef = 'BIGINT';
        break;
      case 'smallint':
        typeDef = 'SMALLINT';
        break;
      case 'decimal':
      case 'numeric':
        typeDef = 'DECIMAL(10, 2)';
        break;
      case 'boolean':
      case 'bool':
        typeDef = 'BOOLEAN';
        break;
      case 'timestamp':
        typeDef = 'TIMESTAMP';
        break;
      case 'timestamptz':
        typeDef = 'TIMESTAMP WITH TIME ZONE';
        break;
      case 'date':
        typeDef = 'DATE';
        break;
      case 'time':
        typeDef = 'TIME';
        break;
      case 'uuid':
        typeDef = 'UUID';
        break;
      case 'json':
        typeDef = 'JSON';
        break;
      case 'jsonb':
        typeDef = 'JSONB';
        break;
      case 'serial':
        typeDef = 'SERIAL';
        break;
      case 'bigserial':
        typeDef = 'BIGSERIAL';
        break;
      default:
        typeDef = type.toUpperCase();
    }

    const nullableDef = isNullable ? '' : ' NOT NULL';
    const primaryDef = isPrimaryKey ? ' PRIMARY KEY' : '';

    return `${name} ${typeDef}${nullableDef}${primaryDef}`;
  }
}
