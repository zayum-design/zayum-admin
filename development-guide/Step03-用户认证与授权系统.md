# Step 03 - 用户认证与授权系统

## 目标
实现完整的JWT认证系统，包括管理员登录、登出、token刷新和权限守卫

## 后端实现

### 3.1 认证模块搭建
- 创建 `auth` 模块（包含 controller、service、module）
- 配置 JWT 策略（JwtStrategy）
- 配置 Passport 本地策略（LocalStrategy）
- 配置 JWT 模块（secret、expiresIn）

### 3.2 JWT 配置
**配置项**：
- `JWT_SECRET`：密钥（建议使用随机字符串，至少32位）
- `JWT_EXPIRES_IN`：访问令牌过期时间（如：2h）
- `JWT_REFRESH_EXPIRES_IN`：刷新令牌过期时间（如：7d）

### 3.3 登录接口实现
**接口**：`POST /api/auth/login`

**请求参数**：
- `username`：用户名（必填）
- `password`：密码（必填）

**业务逻辑**：
1. 验证用户名和密码格式
2. 查询管理员信息（根据 username）
3. 验证账号状态（是否被禁用/隐藏）
4. 使用 bcrypt 验证密码
5. 密码错误时增加 login_failure 计数
6. 登录失败次数超过5次，锁定账号（可选）
7. 验证成功后：
   - 重置 login_failure 为 0
   - 更新 login_at（最后登录时间）
   - 更新 login_ip（登录IP）
   - 生成 JWT token（包含 userId、username、role 等）
   - 将 token 存入数据库
   - 记录登录日志（sys_login_log 表）
8. 返回用户信息和 token

**响应数据**：
```
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "nickname": "超级管理员",
      "email": "admin@example.com",
      "avatar": null,
      "group_id": 1
    },
    "token": {
      "access_token": "eyJhbGc...",
      "token_type": "Bearer",
      "expires_in": 7200
    }
  }
}
```

### 3.4 登出接口实现
**接口**：`POST /api/auth/logout`

**请求头**：
- `Authorization: Bearer {token}`

**业务逻辑**：
1. 从请求头获取 token
2. 解析 token 获取用户信息
3. 将 token 加入黑名单（Redis）或清空数据库中的 token 字段
4. 记录登出日志（可选）
5. 返回成功响应

### 3.5 Token 刷新接口（可选）
**接口**：`POST /api/auth/refresh`

**业务逻辑**：
1. 接收 refresh_token
2. 验证 refresh_token 有效性
3. 生成新的 access_token
4. 返回新 token

### 3.6 获取当前用户信息接口
**接口**：`GET /api/auth/profile`

**请求头**：
- `Authorization: Bearer {token}`

**业务逻辑**：
1. 从 token 解析用户 ID
2. 查询用户详细信息（包括权限）
3. 返回用户信息

### 3.7 JWT 守卫（Guard）创建
- 创建 `JwtAuthGuard`：验证 token 有效性
- 创建 `RolesGuard`：验证用户角色权限
- 创建 `PermissionsGuard`：验证具体操作权限

### 3.8 自定义装饰器
- `@Public()`：标记公开接口，跳过 JWT 验证
- `@CurrentUser()`：获取当前登录用户信息
- `@Roles()`：指定接口需要的角色
- `@Permissions()`：指定接口需要的权限

### 3.9 全局守卫配置
- 在 `main.ts` 或 `app.module.ts` 中配置全局 JWT 守卫
- 所有接口默认需要认证，使用 `@Public()` 装饰器排除

### 3.10 异常处理
- 创建自定义异常过滤器
- 统一处理认证失败、权限不足等异常
- 返回标准错误响应格式

### 3.11 响应拦截器
- 创建全局响应拦截器
- 统一处理成功响应格式
- 包装响应数据

### 3.12 登录日志记录
- 在登录成功/失败时记录日志到 `sys_login_log` 表
- 记录内容：用户信息、IP、浏览器、操作系统、状态、时间等
- 解析 User-Agent 获取浏览器和系统信息
- 根据 IP 获取地理位置（可选，使用第三方 IP 库）

## 前端实现

### 4.1 API 服务封装
- 创建 `src/services/auth.service.ts`
- 封装登录、登出、获取用户信息等 API 调用
- 使用 axios 实例

### 4.2 Axios 拦截器配置
**请求拦截器**：
- 自动添加 token 到请求头（Authorization: Bearer {token}）
- 处理 loading 状态（可选）

**响应拦截器**：
- 统一处理响应数据
- 401 错误时自动跳转到登录页
- 403 错误时提示权限不足
- 其他错误统一提示

### 4.3 状态管理（Store）
- 创建 `src/store/auth.store.ts`（使用 Zustand）或 `authSlice`（使用 Redux）
- 管理状态：
  - `user`：当前登录用户信息
  - `token`：访问令牌
  - `isAuthenticated`：是否已登录
  - `permissions`：用户权限列表
- 管理 actions：
  - `login()`：登录
  - `logout()`：登出
  - `setUser()`：设置用户信息
  - `setToken()`：设置令牌
  - `fetchUserInfo()`：获取用户信息

### 4.4 Token 持久化
- 使用 localStorage 或 sessionStorage 存储 token
- 刷新页面时自动恢复登录状态
- 创建工具函数：
  - `getToken()`：获取 token
  - `setToken()`：设置 token
  - `removeToken()`：删除 token

### 4.5 登录页面开发
**路由**：`/login`

**页面元素**：
- 用户名输入框（必填，antd Input）
- 密码输入框（必填，antd Input.Password）
- 记住我选项（可选，antd Checkbox）
- 登录按钮（antd Button）
- 表单验证提示

**样式要求**：
- 使用 Tailwind CSS + Antd 样式
- 居中布局
- 响应式设计
- 美观的背景或插图

**功能实现**：
1. 表单验证（用户名和密码非空）
2. 调用登录 API
3. 登录成功后：
   - 保存 token 到 localStorage
   - 保存用户信息到 store
   - 跳转到首页或之前访问的页面
4. 登录失败时显示错误提示
5. Loading 状态处理

### 4.6 路由守卫（Router Guard）
- 创建路由守卫组件 `AuthGuard` 或使用路由配置
- 未登录时自动跳转到登录页
- 已登录但访问登录页时跳转到首页
- 记录登录前访问的路径（redirect）

### 4.7 全局布局组件
- 创建 `src/layouts/MainLayout.tsx`
- 包含顶部导航栏（显示用户信息、登出按钮）
- 包含侧边栏（菜单导航）
- 包含内容区域（路由出口）

### 4.8 顶部导航栏
**元素**：
- Logo 和系统名称
- 面包屑导航（可选）
- 用户头像和昵称（下拉菜单）
- 下拉菜单选项：
  - 个人中心
  - 修改密码
  - 退出登录

**登出功能**：
1. 点击退出登录
2. 弹出确认对话框（antd Modal.confirm）
3. 确认后调用登出 API
4. 清除 token 和用户信息
5. 跳转到登录页

### 4.9 初始化流程
**应用启动时**：
1. 检查 localStorage 中是否有 token
2. 如果有 token：
   - 调用获取用户信息接口
   - 验证 token 是否有效
   - 有效则恢复登录状态
   - 无效则清除 token，跳转登录页
3. 如果没有 token：
   - 跳转到登录页

## 测试点

### 后端测试
- [ ] 使用 Postman/Apifox 测试登录接口
- [ ] 验证密码错误时返回正确错误信息
- [ ] 验证账号不存在时返回正确错误信息
- [ ] 验证登录成功后返回 token
- [ ] 验证 token 能正常访问受保护接口
- [ ] 验证无 token 时访问受保护接口返回 401
- [ ] 验证登出接口清除 token
- [ ] 验证登录日志正确记录

### 前端测试
- [ ] 访问登录页面，样式正常
- [ ] 输入正确账号密码，登录成功
- [ ] 输入错误账号密码，显示错误提示
- [ ] 登录成功后跳转到首页
- [ ] 刷新页面，登录状态保持
- [ ] 点击退出登录，成功退出并跳转到登录页
- [ ] 未登录访问受保护页面，自动跳转到登录页
- [ ] 登录后访问登录页，自动跳转到首页

## 验收标准

### 功能验收
- [ ] 管理员可以使用 admin/Admin@888888 成功登录
- [ ] 登录后能看到用户信息和菜单
- [ ] 可以正常退出登录
- [ ] 刷新页面后登录状态保持
- [ ] Token 失效后自动跳转登录页
- [ ] 登录日志正确记录

### 安全验收
- [ ] 密码在传输和存储时已加密
- [ ] Token 设置合理的过期时间
- [ ] 请求头正确携带 token
- [ ] 权限验证正常工作
- [ ] 无明显安全漏洞

## 注意事项

1. **密码安全**：前端传输密码时考虑是否需要额外加密（HTTPS + bcrypt 已足够）
2. **Token 存储**：敏感应用考虑使用 HttpOnly Cookie 存储 token
3. **CSRF 防护**：如使用 Cookie，需配置 CSRF 防护
4. **登录限流**：考虑添加登录频率限制，防止暴力破解
5. **日志脱敏**：登录日志中不应记录明文密码
6. **错误信息**：登录失败时不要明确指出是用户名还是密码错误

## 下一步预告
Step 04 将实现权限管理系统（RBAC权限模型与菜单权限）
