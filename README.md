# Zayum Admin 后台管理系统

![License](https://img.shields.io/badge/license-UNLICENSED-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue)
![React](https://img.shields.io/badge/React-19.2+-61DAFB)
![NestJS](https://img.shields.io/badge/NestJS-11.0+-E0234E)

一个现代化的企业级后台管理系统，基于前后端分离架构，提供完整的用户管理、权限控制、系统监控等功能。

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
│   │   │   ├── system/     # 系统模块
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
│   │   │   └── ...
│   │   ├── components/    # 公共组件
│   │   ├── layouts/       # 布局组件
│   │   ├── store/         # 状态管理
│   │   ├── services/      # API服务
│   │   └── utils/         # 工具函数
│   └── package.json
├── cli/                    # AI CLI 代码生成器
│   ├── src/               # CLI 源码
│   ├── bin/               # 可执行文件
│   └── package.json
├── app/                    # 客户端应用
│   ├── web/               # Web 应用（会员端）
│   │   ├── src/           # 源码
│   │   └── package.json
│   └── ios/               # iOS 原生应用
│       └── ZayumMember/   # iOS 项目
├── development-guide/      # 开发指南文档
└── README.md              # 项目说明文档
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

### Web App 配置

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

## 🤖 AI CLI 代码生成器

项目内置了 AI 驱动的 CLI 工具，支持对话式代码生成：

### 安装与启动
```bash
# 安装 CLI 依赖
cd cli && npm install && npm run build

# 启动 AI 交互模式
cd ..
./zayum ai
```

### 功能特性
- **智能对话**：自然语言描述需求，AI 引导完成开发
- **表结构设计**：自动分析并建议数据库表结构
- **代码生成**：一键生成 Entity、DTO、Service、Controller、Module
- **自动注册**：自动将新模块注册到 app.module.ts
- **菜单生成**：自动生成后端菜单配置
- **多模型支持**：支持 DeepSeek、OpenAI、通义千问、Moonshot

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

  webapp:
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

