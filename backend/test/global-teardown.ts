import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载测试环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// 创建测试数据库连接
const testDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'system_admin_test',
  entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: false,
});

export default async function globalTeardown() {
  console.log('全局测试清理开始...');

  try {
    // 连接到数据库
    await testDataSource.initialize();
    console.log('测试数据库连接成功（清理阶段）');

    // 这里可以添加清理逻辑，比如删除测试数据
    // 注意：我们不删除整个数据库，只清理测试数据

    // 示例：清空所有表（谨慎使用）
    // const queryRunner = testDataSource.createQueryRunner();
    // await queryRunner.connect();
    //
    // // 获取所有表名
    // const tables = await queryRunner.query(
    //   `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    // );
    //
    // // 清空所有表
    // for (const table of tables) {
    //   await queryRunner.query(`TRUNCATE TABLE "${table.tablename}" CASCADE`);
    // }
    //
    // await queryRunner.release();

    console.log('全局测试清理完成');
  } catch (error) {
    console.error('全局测试清理失败:', error);
    throw error;
  } finally {
    // 关闭连接
    if (testDataSource.isInitialized) {
      await testDataSource.destroy();
    }
  }
}