# 后台自动化测试框架

这个目录包含后台服务的自动化测试文件。所有测试相关文件都已配置为不提交到git仓库（通过.gitignore管理）。

## 测试文件说明

### 现有文件（不提交到git）
- `auth.integration-spec.ts` - 认证模块集成测试
- `user.integration-spec.ts` - 用户管理模块测试模板
- `permission.integration-spec.ts` - 权限管理模块测试模板
- `global-setup.ts` - 全局测试设置
- `global-teardown.ts` - 全局测试清理
- `setup.ts` - 测试设置
- `jest-integration.json` - 集成测试配置

### 保留文件（可提交）
- `app.e2e-spec.ts` - 应用E2E测试（已有）
- `jest-e2e.json` - E2E测试配置（已有）

## 如何使用测试框架

### 1. 恢复测试配置
由于测试文件不提交到git，使用时需要手动恢复配置：

#### 更新 package.json
在 `scripts` 部分添加：
```json
"test:integration": "NODE_ENV=test jest --config ./test/jest-integration.json",
"test:all": "npm run test && npm run test:integration && npm run test:e2e"
```

#### 更新 app.module.ts
在 `NestConfigModule.forRoot` 中修改：
```typescript
envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
```

在 `TypeOrmModule.forRootAsync` 的 `useFactory` 中添加测试环境支持：
```typescript
useFactory: (configService: ConfigService) => {
  const nodeEnv = configService.get('NODE_ENV') || 'development';

  // 测试环境下使用SQLite内存数据库
  if (nodeEnv === 'test') {
    return {
      type: 'sqlite',
      database: ':memory:',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // 测试环境下自动同步
      logging: false,
    };
  }

  // 生产/开发环境使用PostgreSQL
  return {
    type: 'postgres',
    host: configService.get('DB_HOST') || 'localhost',
    port: parseInt(configService.get('DB_PORT') || '5432', 10),
    username: configService.get('DB_USERNAME') || 'niujinhui',
    password: configService.get('DB_PASSWORD') || '',
    database: configService.get('DB_DATABASE') || 'system_admin',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: false,
  };
},
```

#### 创建测试环境文件
在backend目录创建 `.env.test`：
```env
# 测试环境配置
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=niujinhui
DB_PASSWORD=
DB_DATABASE=system_admin

JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

PORT=3001
NODE_ENV=test
FRONTEND_URL=http://localhost:5173

# 禁用AI测试
AI_DEEPSEEK_ENABLED=false
AI_OPENAI_ENABLED=false
AI_QWEN_ENABLED=false
AI_MOONSHOT_ENABLED=false
AI_ANTHROPIC_ENABLED=false
AI_OPENROUTER_ENABLED=false
AI_MINIMAX_ENABLED=false
AI_ZHIPU_ENABLED=false
```

### 2. 运行测试
```bash
# 设置测试环境变量
export NODE_ENV=test

# 运行集成测试
npm run test:integration

# 或手动运行
NODE_ENV=test jest --config ./test/jest-integration.json
```

### 3. 编写新测试
1. 在 `test/` 目录创建 `[模块名].integration-spec.ts` 文件
2. 参考现有测试模板编写
3. 文件名必须包含 `.integration-spec.ts` 后缀

## 测试框架特点

### 数据库隔离
- 测试环境使用SQLite内存数据库
- 每个测试文件独立运行，数据自动清理
- 不会影响开发/生产数据库

### 认证测试
- 包含完整的登录/登出流程测试
- 测试JWT令牌验证
- 测试权限检查和菜单获取

### 模块化设计
- 每个模块有独立的测试文件
- 测试数据在 `beforeAll` 钩子中创建
- 支持事务管理，测试后自动回滚

## 注意事项

1. **不提交到git**：所有测试文件已配置在 `.gitignore` 中
2. **本地使用**：测试框架仅用于本地开发和验证
3. **配置恢复**：每次拉取代码后需要手动恢复测试配置
4. **环境变量**：测试需要正确的环境变量配置

## 模块测试清单

### 已实现测试
- [x] auth - 认证模块

### 测试模板（需要完善）
- [ ] user - 用户管理模块
- [ ] permission - 权限管理模块

### 待测试模块
- [ ] admin - 管理员管理模块
- [ ] plugin - 插件管理模块
- [ ] ai - AI模块
- [ ] code-generator - 代码生成器模块
- [ ] member - 会员中心模块
- [ ] config - 系统配置模块
- [ ] log - 日志模块
- [ ] upload - 文件上传模块
- [ ] notification - 消息通知模块
- [ ] profile - 个人资料模块
- [ ] user-balance - 用户余额模块
- [ ] user-score - 用户积分模块
- [ ] user-order - 用户订单模块
- [ ] user-group - 用户组模块
- [ ] admin-group - 管理员组模块

## 故障排除

### 测试失败
1. **数据库连接错误**：确保PostgreSQL服务运行
2. **认证失败**：检查JWT密钥配置
3. **测试超时**：调整Jest超时设置

### 环境问题
1. **缺少环境变量**：创建正确的 `.env.test` 文件
2. **配置未恢复**：按照"恢复测试配置"步骤操作
3. **依赖问题**：运行 `npm install` 安装测试依赖