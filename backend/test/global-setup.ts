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

export default async function globalSetup() {
  console.log('全局测试设置开始...');

  try {
    // 连接到数据库
    await testDataSource.initialize();
    console.log('测试数据库连接成功');

    // 检查数据库是否存在，如果不存在则创建
    // 注意：需要超级用户权限来创建数据库
    // 这里我们假设数据库已经存在，或者使用现有数据库

    // 运行数据库迁移（如果需要）
    // 这里暂时不运行迁移，假设表结构已经存在

    console.log('全局测试设置完成');
  } catch (error) {
    console.error('全局测试设置失败:', error);
    throw error;
  } finally {
    // 关闭连接
    if (testDataSource.isInitialized) {
      await testDataSource.destroy();
    }
  }
}