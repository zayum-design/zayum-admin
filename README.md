# Zayum Admin 后台管理系统

![License](https://img.shields.io/badge/license-UNLICENSED-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue)
![React](https://img.shields.io/badge/React-19.2+-61DAFB)
![NestJS](https://img.shields.io/badge/NestJS-11.0+-E0234E)

一个现代化的企业级后台管理系统，基于前后端分离架构，提供完整的用户管理、权限控制、系统监控等功能。同时包含可视化代码生成器、Web/iOS 会员中心应用，支持多端协同。

## 🐟 关于 Zayum

**Zayum**（栈鱼）是「栈鱼」的英文谐音。

> 作者自认为自己是一只做全栈开发的鱼 🐟 —— 穿梭于技术栈的海洋中，前端游弋，后端深潜，全栈畅游。

## 🌟 功能特性

### 🎯 核心功能
- **RBAC权限管理**：基于角色的访问控制，支持菜单级、按钮级权限控制
- **JWT认证授权**：安全的用户认证和授权机制
- **多租户支持**：管理员组和用户组两级权限体系
- **响应式设计**：适配桌面、平板、手机等多种设备

### 📊 管理模块
- **用户管理**：用户CRUD、状态管理、密码重置
- **管理员管理**：管理员账号管理、角色分配
- **权限管理**：权限树形结构管理、动态菜单生成
- **系统配置**：系统参数配置、运行状态监控
- **文件管理**：文件上传、下载、在线预览
- **日志管理**：操作日志、登录日志记录与查询
- **消息通知**：站内消息、通知管理
- **代码生成器**：可视化数据表设计、前后端代码自动生成、菜单自动创建
- **用户余额**：余额记录查询、充值管理
- **用户积分**：积分记录查询、积分变动管理

### 🛡️ 安全特性
- **密码加密存储**：使用bcrypt进行密码哈希
- **JWT令牌认证**：安全的令牌验证机制
- **权限守卫**：接口级别的权限验证
- **防暴力破解**：登录失败次数限制
- **SQL注入防护**：使用TypeORM参数化查询

## 🏗️ 技术栈

### 后端技术栈
- **框架**：NestJS 11.x
- **语言**：TypeScript 5.x
- **数据库**：PostgreSQL + TypeORM
- **认证**：JWT + Passport
- **API文档**：Swagger（待集成）
- **日志**：Winston
- **安全**：Helmet、bcrypt、CORS
- **AI集成**：支持 DeepSeek、OpenAI、通义千问、Moonshot 等多模型

### 前端技术栈
- **框架**：React 19.x + TypeScript
- **构建工具**：Vite 8.x
- **UI库**：Ant Design 6.x
- **样式**：Tailwind CSS 3.x
- **状态管理**：Zustand
- **路由**：React Router DOM 7.x
- **HTTP客户端**：Axios
- **表单处理**：React Hook Form + Zod

### App 技术栈
- **Web App**：React 19.x + Vite 8.x + Ant Design 6.x
- **iOS App**：原生 iOS 开发（Swift）

## 📁 项目结构

```
zayum-admin/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── modules/        # 业务模块
│   │   │   ├── auth/       # 认证模块
│   │   │   ├── user/       # 用户模块
│   │   │   ├── admin/      # 管理员模块
│   │   │   ├── permission/ # 权限模块
│   │   │   ├── code-generator/  # 代码生成器模块
│   │   │   ├── member/     # 会员中心模块
│   │   │   ├── user-balance/  # 用户余额模块
│   │   │   ├── user-score/    # 用户积分模块
│   │   │   ├── upload/     # 文件上传模块
│   │   │   ├── log/        # 日志模块
│   │   │   └── ...
│   │   ├── entities/       # 数据库实体
│   │   ├── database/       # 数据库配置和种子数据
│   │   └── main.ts         # 应用入口
│   └── package.json
├── frontend/               # 管理后台前端
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   │   ├── dashboard/ # 仪表盘
│   │   │   ├── user/      # 用户管理
│   │   │   ├── system/    # 系统管理
│   │   │   ├── code-generator/  # 代码生成器
│   │   │   ├── user-balance/  # 用户余额
│   │   │   ├── user-score/    # 用户积分
│   │   │   └── ...
│   │   ├── components/    # 公共组件
│   │   ├── layouts/       # 布局组件
│   │   ├── store/         # 状态管理
│   │   ├── services/      # API服务
│   │   └── utils/         # 工具函数
│   └── package.json
├── cli/                    # 插件管理 CLI 工具
│   ├── bin/               # 可执行文件
│   ├── src/               # CLI 源码
│   │   ├── commands/      # 命令实现
│   │   ├── utils/         # 工具函数
│   │   └── types/         # 类型定义
│   ├── README.md          # CLI 使用文档
│   └── package.json
├── plugins/                # 插件目录
│   └── schedule/          # 定时任务插件示例
│       ├── plugin.json    # 插件配置
│       ├── backend/       # 插件后端代码
│       └── frontend/      # 插件前端代码
├── app/                    # 客户端应用
│   ├── web/               # Web 应用（会员端）
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── login/     # 会员登录
│   │   │   │   ├── register/  # 会员注册
│   │   │   │   ├── member/    # 会员中心
│   │   │   │   └── recharge/  # 充值页面
│   │   │   ├── services/  # API服务
│   │   │   └── store/     # 状态管理
│   │   └── package.json
│   └── ios/               # iOS 原生应用
│       └── ZayumMember/   # iOS 项目
├── development-guide/          # 后端开发指南文档
├── development-guide-web/      # Web App 开发指南文档
├── development-guide-ios/      # iOS App 开发指南文档
├── development-guide-plugin/   # 插件系统开发文档
├── plugin-market/              # 插件市场服务（可选）
│   ├── src/
│   │   ├── controllers/        # 市场 API 控制器
│   │   ├── services/           # 市场服务
│   │   ├── entities/           # 数据库实体
│   │   └── main.ts             # 服务入口
│   ├── uploads/                # 插件包存储目录
│   └── package.json
└── README.md                   # 项目说明文档
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- PostgreSQL >= 13.0
- npm >= 9.0.0 或 yarn >= 1.22.0

### 后端配置

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd zayum-admin
   ```

2. **配置数据库**
   ```bash
   # 创建数据库
   createdb system_admin

   # 或使用psql
   psql -U postgres -c "CREATE DATABASE system_admin;"
   ```

3. **配置环境变量**
   ```bash
   cd backend
   cp .env.example .env  # 如果存在示例文件
   # 编辑.env文件，配置数据库连接等信息
   ```

4. **安装依赖并启动**
   ```bash
   # 安装依赖
   npm install

   # 运行数据库迁移（如果有）
   # 运行种子数据
   npm run seed

   # 启动开发服务器
   npm run start:dev
   ```

### 前端配置

1. **进入前端目录**
   ```bash
   cd ../frontend
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   - 后端API：http://localhost:3000
   - 前端应用：http://localhost:5173

### Web App 会员端配置

1. **进入 Web App 目录**
   ```bash
   cd app/web
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   - Web App：http://localhost:5174

### Web App 功能说明

- **会员注册/登录**：支持手机号+验证码快速注册登录
- **会员中心**：查看个人信息、余额、积分
- **余额充值**：在线充值账户余额
- **积分记录**：查看积分获取和消费记录
- **订单管理**：查看会员订单列表和详情

### iOS App 配置

1. **进入 iOS 项目目录**
   ```bash
   cd app/ios/ZayumMember
   ```

2. **使用 Xcode 打开项目**
   ```bash
   open ZayumMember.xcodeproj
   # 或
   open ZayumMember.xcworkspace
   ```

3. **在 Xcode 中运行**
   - 选择目标设备/模拟器
   - 点击运行按钮或按 `Cmd + R`

### 环境配置说明

#### 后端环境变量 (.env)
```env
# 数据库配置
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=你的数据库用户名
DB_PASSWORD=你的数据库密码
DB_DATABASE=system_admin

# JWT 配置
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# 应用配置
PORT=3000
NODE_ENV=development

# 前端地址 (用于 CORS)
FRONTEND_URL=http://localhost:5173

# Web App 地址 (用于 CORS)
WEBAPP_URL=http://localhost:5174
```

#### 数据库初始化
项目使用TypeORM，数据库表结构会自动创建。首次运行需要执行种子数据：

```bash
cd backend
npm run seed
```

### 默认登录账号
- **用户名**：admin
- **密码**：Admin@888888

## 🤖 AI 代码生成器


### 功能特性
- **智能对话**：自然语言描述需求，AI 引导完成开发
- **表结构设计**：自动分析并建议数据库表结构
- **代码生成**：一键生成 Entity、DTO、Service、Controller、Module
- **自动注册**：自动将新模块注册到 app.module.ts
- **菜单生成**：自动生成后端菜单配置
- **多模型支持**：支持 DeepSeek、OpenAI、通义千问、Moonshot
- **代码清理**：支持一键删除数据表对应的所有源码文件

## 🎨 可视化代码生成器

系统内置可视化代码生成器，通过界面操作即可快速创建功能模块：

### 功能特性
- **数据表设计**：可视化创建和编辑数据库表结构
- **字段管理**：支持多种数据类型、默认值、注释、索引设置
- **代码生成**：自动生成完整的后端代码（Entity、DTO、Service、Controller、Module）
- **前端生成**：自动生成前端页面代码（列表页、表单页、服务层）
- **菜单创建**：自动生成系统菜单配置和权限点
- **代码预览**：在线预览生成的代码文件
- **代码下载**：支持打包下载生成的源代码
- **代码清理**：一键删除数据表对应的所有源码文件

### 使用方式
1. 登录管理后台 → 系统管理 → 代码生成器
2. 创建数据表并设计字段
3. 选择生成选项（后端/前端/菜单）
4. 预览并确认生成的代码
5. 保存代码到项目或直接下载

## 🔌 插件系统

Zayum Admin 支持通过插件机制动态扩展系统功能，使用 CLI 工具可以轻松安装、卸载、启用和禁用插件。

### 功能特性
- **动态安装/卸载**：通过 CLI 一键安装或卸载插件
- **数据库迁移**：安装时自动执行迁移，卸载时自动回滚
- **菜单注入**：自动注册前端菜单和权限点
- **前后端分离**：插件可包含后端模块和前端组件
- **钩子机制**：支持登录/注册钩子扩展

### 插件市场

Zayum 支持从远端插件市场安装插件，也可以配置多个插件源（官方市场、私有仓库等）。

#### 管理插件源

```bash
# 列出所有插件源
zayum source:list

# 添加插件源
zayum source:add private https://plugins.mycompany.com --token xxx

# 设置默认源
zayum source:default private

# 启用/禁用源
zayum source:enable private
zayum source:disable private
```

#### 搜索和安装插件

```bash
# 搜索插件
zayum plugin:search schedule
zayum plugin:search cron --source official

# 从市场安装插件（最新版本）
zayum plugin:install schedule
zayum plugin:install schedule --enable

# 安装指定版本
zayum plugin:install schedule --version 1.2.0

# 从指定源安装
zayum plugin:install schedule --source official

# 从 URL 安装
zayum plugin:install https://example.com/schedule@1.0.0.zip --url

# 从本地安装
zayum plugin:install ./plugins/schedule --local
```

#### 更新插件

```bash
# 检查更新
zayum plugin:list

# 更新到最新版本
zayum plugin:update schedule

# 更新到指定版本
zayum plugin:update schedule --version 1.2.0
```

#### 插件管理

```bash
# 列出已安装插件
zayum plugin:list
zayum plugin:list --installed
zayum plugin:list --enabled

# 启用/禁用插件
zayum plugin:enable schedule
zayum plugin:disable schedule

# 卸载插件
zayum plugin:uninstall schedule
```

### 插件开发

#### 插件目录结构
```
my-plugin/
├── plugin.json           # 插件配置文件
├── backend/              # 后端代码
│   └── src/
│       ├── index.ts      # 模块入口
│       ├── module.ts     # NestJS 模块
│       ├── controller.ts
│       ├── service.ts
│       ├── entities/     # 数据库实体
│       └── migrations/   # 迁移文件
└── frontend/             # 前端代码
    └── src/
        ├── index.ts      # 插件入口
        ├── routes.tsx    # 路由配置
        └── pages/        # 页面组件
```

#### plugin.json 示例
```json
{
  "name": "schedule",
  "version": "1.0.0",
  "displayName": "定时任务",
  "description": "系统定时任务管理",
  "author": "zayum",
  "backend": {
    "entry": "dist/backend/index.js",
    "migrations": ["dist/backend/migrations/*.js"],
    "entities": ["dist/backend/entities/*.entity.js"]
  },
  "frontend": {
    "entry": "dist/frontend/index.js",
    "routes": true,
    "menu": true
  }
}
```

详细开发文档参见 [development-guide-plugin/](development-guide-plugin/)

### 内置示例插件

项目内置了**定时任务**插件作为示例：
- 支持 Cron 表达式配置
- 任务启停管理
- 执行日志记录
- 可视化任务管理界面

```bash
# 安装并启用定时任务插件
zayum plugin:install ./plugins/schedule --enable
```

## 📱 Web App 会员中心

为系统提供客户端会员中心功能，支持用户注册、登录、充值等：

### 功能特性
- **会员注册/登录**：支持手机号+验证码注册登录
- **会员中心**：个人信息管理、余额/积分查看
- **余额管理**：余额充值、余额消费记录
- **积分管理**：积分获取、积分消费记录
- **订单管理**：订单查询、订单状态跟踪

### 技术栈
- React 19 + TypeScript + Vite 8
- Ant Design 6 + Tailwind CSS 3
- Zustand 状态管理

### 启动方式
```bash
cd app/web
npm install
npm run dev
# 访问 http://localhost:5174
```

## 🍎 iOS App 会员中心

原生 iOS 会员中心应用，提供流畅的移动端体验：

### 功能特性
- **会员认证**：登录、注册、验证码获取
- **个人中心**：会员信息展示、余额/积分显示
- **记录查询**：余额记录、积分记录查看
- **充值功能**：余额充值、积分充值

### 启动方式
```bash
cd app/ios/ZayumMember
open ZayumMember.xcodeproj
# 在 Xcode 中选择模拟器或设备运行
```

### 工作流程
1. 描述需求：告诉 AI 你想开发什么功能
2. 设计表结构：AI 引导设计数据库表结构
3. 确认功能：确认需要的 CRUD 功能
4. 生成代码：AI 生成完整的后端代码
5. 预览代码：使用 `/preview` 查看生成的文件
6. 保存代码：使用 `/save` 将代码写入项目

### 常用命令
| 命令 | 说明 |
|------|------|
| `/new` | 创建新会话 |
| `/model` | 切换 AI 模型 |
| `/provider` | 切换 AI 提供商 |
| `/save` | 保存代码到项目 |
| `/exit` | 退出 |

更多详情查看 [cli/README.md](cli/README.md)

## 🔧 API接口

### 认证接口
- `POST /api/admin/auth/login` - 管理员登录
- `POST /api/admin/auth/logout` - 管理员登出
- `GET /api/admin/auth/profile` - 获取个人信息
- `GET /api/admin/auth/permissions` - 获取用户权限
- `GET /api/admin/auth/menus` - 获取用户菜单

### 用户管理接口
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户
- `POST /api/users/:id/reset-password` - 重置密码

### 管理员管理接口
- `GET /api/admins` - 获取管理员列表
- `POST /api/admins` - 创建管理员
- `PUT /api/admins/:id` - 更新管理员
- `DELETE /api/admins/:id` - 删除管理员

### 权限管理接口
- `GET /api/permissions/tree` - 获取权限树
- `POST /api/permissions` - 创建权限
- `PUT /api/permissions/:id` - 更新权限
- `DELETE /api/permissions/:id` - 删除权限

### 代码生成器接口
- `GET /api/code-generator/tables` - 获取数据库表列表
- `POST /api/code-generator/tables` - 创建数据表
- `GET /api/code-generator/tables/:table/columns` - 获取表字段
- `POST /api/code-generator/tables/check` - 检查表是否存在
- `POST /api/code-generator/generate` - 生成代码
- `POST /api/code-generator/menus` - 创建菜单
- `POST /api/code-generator/download` - 下载代码
- `POST /api/code-generator/delete` - 删除代码

### 用户余额接口
- `GET /api/user-balances` - 获取余额记录列表
- `POST /api/user-balances` - 创建余额记录
- `POST /api/user-balances/recharge` - 余额充值

### 用户积分接口
- `GET /api/user-scores` - 获取积分记录列表
- `POST /api/user-scores` - 创建积分记录
- `POST /api/user-scores/recharge` - 积分充值

### 会员中心接口
- `POST /api/member/register` - 会员注册
- `POST /api/member/login` - 会员登录
- `POST /api/member/sms-code` - 发送验证码
- `GET /api/member/profile` - 获取会员信息
- `PUT /api/member/profile` - 更新会员信息
- `GET /api/member/balance-records` - 余额记录
- `GET /api/member/score-records` - 积分记录
- `POST /api/member/recharge/balance` - 余额充值
- `POST /api/member/recharge/score` - 积分充值

## 🐳 Docker部署

### 使用Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: system_admin
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: admin
      DB_PASSWORD: admin123
      DB_DATABASE: system_admin
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

  webapp-member:
    build: ./app/web
    ports:
      - "5174:5174"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 构建和运行
```bash
docker-compose up -d
```

## 🧪 测试

### 后端测试
```bash
cd backend
npm test              # 运行单元测试
npm run test:e2e     # 运行端到端测试
npm run test:cov     # 生成测试覆盖率报告
```

### 前端测试
```bash
cd frontend
# 待集成测试框架
```

## 📈 性能优化

### 已实施的优化
- **代码分割**：React.lazy + Suspense 实现路由懒加载
- **图片优化**：按需加载、图片压缩
- **API缓存**：合理的缓存策略
- **数据库索引**：关键字段添加索引

### 建议的进一步优化
- **CDN加速**：静态资源使用CDN
- **数据库连接池**：优化数据库连接
- **Redis缓存**：热点数据缓存
- **负载均衡**：多实例部署

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 代码规范
- 使用 TypeScript，确保类型安全
- 遵循 ESLint 和 Prettier 规则
- 添加必要的注释和文档
- 编写单元测试

## 📄 许可证

本项目为私有项目，未经许可不得用于商业用途。

## ❓ 常见问题

### Q1: 按钮权限不显示怎么办？
**A**: 可能是数据库缺少按钮权限数据。解决方案：
1. 重新运行种子数据：`cd backend && npm run seed`
2. 清除浏览器缓存并重新登录
3. 检查浏览器控制台是否有权限API错误

### Q2: 数据库连接失败怎么办？
**A**: 检查以下配置：
1. PostgreSQL服务是否运行：`pg_isready`
2. 数据库用户名密码是否正确
3. `.env`文件中的数据库配置是否正确
4. 确保已创建数据库：`createdb system_admin`

### Q3: 前端访问后端API跨域错误？
**A**: 检查CORS配置：
1. 确保`FRONTEND_URL`在`.env`中正确配置
2. 后端和前端是否使用正确的端口
3. 重启后端服务使配置生效

### Q4: 如何添加新的权限？
**A**: 通过权限管理页面添加，或直接插入数据库：
1. 登录系统 → 系统管理 → 权限管理
2. 点击"新增权限"按钮
3. 填写权限信息（注意权限码格式：`module:page:action`）

### Q5: 如何修改默认管理员密码？
**A**: 在用户管理页面重置密码，或通过数据库：
```sql
UPDATE sys_admin SET password = bcrypt_hash('新密码', 10) WHERE username = 'admin';
```

## 📞 支持与反馈

如有问题或建议，请通过以下方式联系：

1. 创建 [Issue](https://github.com/your-repo/issues)

