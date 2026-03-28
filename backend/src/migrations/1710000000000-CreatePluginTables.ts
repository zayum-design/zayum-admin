import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePluginTables1710000000000 implements MigrationInterface {
  name = 'CreatePluginTables1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建 sys_plugin 表
    await queryRunner.createTable(
      new Table({
        name: 'sys_plugin',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '64',
            isUnique: true,
          },
          {
            name: 'displayName',
            type: 'varchar',
            length: '128',
          },
          {
            name: 'version',
            type: 'varchar',
            length: '32',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['installed', 'enabled', 'disabled', 'error'],
            default: "'installed'",
          },
          {
            name: 'config',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'manifest',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'hasMigrations',
            type: 'boolean',
            default: false,
          },
          {
            name: 'lastActivatedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'installedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 创建索引
    await queryRunner.createIndex(
      'sys_plugin',
      new TableIndex({
        name: 'IDX_PLUGIN_NAME',
        columnNames: ['name'],
      }),
    );

    await queryRunner.createIndex(
      'sys_plugin',
      new TableIndex({
        name: 'IDX_PLUGIN_STATUS',
        columnNames: ['status'],
      }),
    );

    // 创建 sys_plugin_menu 表
    await queryRunner.createTable(
      new Table({
        name: 'sys_plugin_menu',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'pluginId',
            type: 'int',
          },
          {
            name: 'menuKey',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'menuName',
            type: 'varchar',
            length: '128',
          },
          {
            name: 'path',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'component',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'parentId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'orderNum',
            type: 'int',
            default: 0,
          },
          {
            name: 'permission',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'meta',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 创建索引
    await queryRunner.createIndex(
      'sys_plugin_menu',
      new TableIndex({
        name: 'IDX_PLUGIN_MENU_PLUGIN_ID',
        columnNames: ['pluginId'],
      }),
    );

    await queryRunner.createIndex(
      'sys_plugin_menu',
      new TableIndex({
        name: 'IDX_PLUGIN_MENU_KEY',
        columnNames: ['menuKey'],
      }),
    );

    // 添加外键
    await queryRunner.createForeignKey(
      'sys_plugin_menu',
      new TableForeignKey({
        columnNames: ['pluginId'],
        referencedTableName: 'sys_plugin',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sys_plugin_menu');
    await queryRunner.dropTable('sys_plugin');
  }
}
