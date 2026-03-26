# Step 01 - 项目初始化与环境搭建

## 目标
完成前后端项目的基础架构搭建，确保开发环境正常运行

## 前端部分

### 1.1 创建 React + Vite 项目
- 使用 Vite 创建 React + TypeScript 项目
- 项目名称：`frontend`
- 选择 React + TypeScript 模板

### 1.2 安装核心依赖
- **UI 框架**：antd@6.3.x
- **样式**：tailwindcss、postcss、autoprefixer
- **路由**：react-router-dom
- **状态管理**：zustand 或 redux-toolkit
- **HTTP 请求**：axios
- **表单验证**：react-hook-form + zod
- **图标**：@ant-design/icons
- **工具库**：dayjs、lodash

### 1.3 配置 Tailwind CSS
- 初始化 Tailwind 配置文件
- 配置 `tailwind.config.js`，与 Antd 兼容
- 在主 CSS 文件中引入 Tailwind 指令
- 配置 PostCSS

### 1.4 项目目录结构
```
frontend/
├── src/
│   ├── assets/          # 静态资源
│   ├── components/      # 公共组件
│   ├── layouts/         # 布局组件
│   ├── pages/           # 页面组件
│   ├── services/        # API 服务
│   ├── store/           # 状态管理
│   ├── types/           # TypeScript 类型定义
│   ├── utils/           # 工具函数
│   ├── hooks/           # 自定义 Hooks
│   ├── constants/       # 常量定义
│   ├── App.tsx
│   └── main.tsx
├── public/
└── package.json
```

### 1.5 环境变量配置
- 创建 `.env.development` 和 `.env.production`
- 配置后端 API 地址（开发环境：http://localhost:3000）

## 后端部分

### 2.1 创建 NestJS 项目
- 使用 NestJS CLI 创建项目
- 项目名称：`backend`
- 选择包管理器（npm/yarn/pnpm）

### 2.2 安装核心依赖
- **数据库 ORM**：@nestjs/typeorm、typeorm、pg（PostgreSQL）/ mongoose（MongoDB）
- **验证**：class-validator、class-transformer
- **认证**：@nestjs/jwt、@nestjs/passport、passport、passport-jwt
- **配置**：@nestjs/config
- **加密**：bcrypt
- **日志**：winston
- **文件上传**：multer、@nestjs/platform-express
- **邮件**：nodemailer

### 2.3 项目目录结构
```
backend/
├── src/
│   ├── modules/         # 功能模块
│   │   ├── auth/       # 认证模块
│   │   ├── admin/      # 管理员模块
│   │   ├── user/       # 用户模块
│   │   └── ...
│   ├── common/          # 公共模块
│   │   ├── decorators/ # 装饰器
│   │   ├── filters/    # 异常过滤器
│   │   ├── guards/     # 守卫
│   │   ├── interceptors/ # 拦截器
│   │   ├── pipes/      # 管道
│   │   └── dto/        # 通用 DTO
│   ├── config/          # 配置文件
│   ├── database/        # 数据库配置
│   ├── entities/        # 数据库实体
│   ├── utils/           # 工具函数
│   ├── app.module.ts
│   └── main.ts
├── uploads/             # 上传文件目录
└── package.json
```

### 2.4 数据库选择与配置
- **选择数据库**：PostgreSQL（推荐）或 MongoDB
- 安装数据库客户端
- 创建数据库实例（数据库名：`system_admin`）

### 2.5 环境变量配置
- 创建 `.env` 文件
- 配置数据库连接信息
- 配置 JWT 密钥
- 配置端口号（默认 3000）

### 2.6 CORS 配置
- 在 `main.ts` 中启用 CORS
- 允许前端域名跨域访问

## 数据库部分

### 3.1 PostgreSQL 设置（如选择 PostgreSQL）
- 安装 PostgreSQL
- 创建数据库：`system_admin`
- 配置用户权限
- 测试连接

### 3.2 MongoDB 设置（如选择 MongoDB）
- 安装 MongoDB
- 创建数据库：`system_admin`
- 配置用户权限
- 测试连接

## 验收标准

### 前端验收
- [ ] 执行 `npm run dev` 能正常启动项目
- [ ] 访问 http://localhost:5173 能看到默认页面
- [ ] Tailwind CSS 样式正常工作
- [ ] Antd 组件能正常使用
- [ ] 开发者工具无报错

### 后端验收
- [ ] 执行 `npm run start:dev` 能正常启动项目
- [ ] 访问 http://localhost:3000 能看到默认响应
- [ ] 数据库连接成功
- [ ] Swagger 文档可访问（如已配置）
- [ ] 控制台无报错

### 整体验收
- [ ] 前后端能同时运行不冲突
- [ ] 环境变量配置正确
- [ ] 项目结构清晰合理

## 注意事项

1. **版本控制**：初始化 Git 仓库，创建 `.gitignore` 文件
2. **代码规范**：配置 ESLint 和 Prettier
3. **TypeScript**：确保前后端都使用 TypeScript
4. **端口占用**：确保 3000（后端）和 5173（前端）端口未被占用
5. **依赖版本**：记录所有依赖的版本号，避免版本冲突

## 下一步预告
Step 02 将实现数据库表设计与实体创建，包括管理员表（sys_admin）的完整设计
