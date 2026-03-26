# Step 04 - RBAC权限管理系统

## 目标
实现基于角色的访问控制（RBAC）系统，包括权限定义、角色权限分配、动态菜单生成

## 后端实现

### 4.1 权限模块搭建
- 创建 `permission` 模块（controller、service、module）
- 实现权限的 CRUD 操作
- 实现权限树结构查询

### 4.2 权限数据初始化
**创建默认权限数据**（菜单权限示例）：

**一级菜单**：
- 系统管理（code: system, type: menu）
  - 管理员管理（code: system:admin, type: menu, path: /system/admin）
    - 查看（code: system:admin:view, type: button）
    - 新增（code: system:admin:create, type: button）
    - 编辑（code: system:admin:edit, type: button）
    - 删除（code: system:admin:delete, type: button）
  - 管理员组管理（code: system:admin-group, type: menu, path: /system/admin-group）
    - 查看（code: system:admin-group:view, type: button）
    - 新增（code: system:admin-group:create, type: button）
    - 编辑（code: system:admin-group:edit, type: button）
    - 删除（code: system:admin-group:delete, type: button）
  - 权限管理（code: system:permission, type: menu, path: /system/permission）
  - 系统配置（code: system:config, type: menu, path: /system/config）

- 用户管理（code: user-management, type: menu）
  - 用户列表（code: user:list, type: menu, path: /user/list）
  - 用户组管理（code: user:group, type: menu, path: /user/group）

- 日志管理（code: log, type: menu）
  - 操作日志（code: log:operation, type: menu, path: /log/operation）
  - 登录日志（code: log:login, type: menu, path: /log/login）

- 文件管理（code: file, type: menu）
  - 文件列表（code: file:list, type: menu, path: /file/list）

- 消息管理（code: message, type: menu）
  - 消息列表（code: message:list, type: menu, path: /message/list）

### 4.3 权限 CRUD 接口

#### 查询权限列表（树形）
**接口**：`GET /api/permissions/tree`

**查询参数**：
- `status`：状态筛选（可选）
- `type`：类型筛选（可选）

**业务逻辑**：
1. 查询所有权限
2. 构建树形结构（parent_id 关系）
3. 按 sort 字段排序
4. 返回树形数据

**响应格式**：
```
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "系统管理",
      "code": "system",
      "type": "menu",
      "children": [
        {
          "id": 2,
          "name": "管理员管理",
          "code": "system:admin",
          "type": "menu",
          "path": "/system/admin",
          "children": [...]
        }
      ]
    }
  ]
}
```

#### 创建权限
**接口**：`POST /api/permissions`

**请求参数**：
- `parent_id`：父权限ID（0为顶级）
- `name`：权限名称
- `code`：权限代码（唯一）
- `type`：类型（menu/button/api）
- `path`：路由路径（可选）
- `icon`：图标（可选）
- `component`：组件路径（可选）
- `sort`：排序

**验证规则**：
- code 必须唯一
- name 必填
- 如果是菜单类型，path 必填

#### 更新权限
**接口**：`PUT /api/permissions/:id`

**业务逻辑**：
- 不能修改 code（或严格验证）
- 不能将父权限设置为自己或自己的子权限

#### 删除权限
**接口**：`DELETE /api/permissions/:id`

**业务逻辑**：
1. 检查是否有子权限，有则不允许删除
2. 检查是否被角色使用，考虑是否允许删除
3. 删除权限及其关联关系

### 4.4 角色权限关联接口

#### 获取角色的权限
**接口**：`GET /api/role-permissions`

**查询参数**：
- `role_type`：角色类型（admin_group/user_group）
- `role_id`：角色ID

**业务逻辑**：
1. 查询 sys_role_permission 表
2. 返回该角色拥有的所有权限ID列表

#### 为角色分配权限
**接口**：`POST /api/role-permissions`

**请求参数**：
- `role_type`：角色类型
- `role_id`：角色ID
- `permission_ids`：权限ID数组

**业务逻辑**：
1. 使用事务处理
2. 删除该角色原有的所有权限关联
3. 批量插入新的权限关联
4. 提交事务

### 4.5 用户权限获取接口

#### 获取当前用户的权限列表
**接口**：`GET /api/auth/permissions`

**业务逻辑**：
1. 从 token 获取用户ID和类型
2. 查询用户所属组
3. 查询该组的权限关联
4. 返回权限列表（包含权限详细信息）
5. 如果是超级管理员，返回所有权限

**响应格式**：
```
{
  "code": 200,
  "data": {
    "permissions": [
      {
        "id": 1,
        "name": "系统管理",
        "code": "system",
        "type": "menu"
      },
      ...
    ],
    "codes": ["system", "system:admin", "system:admin:view", ...]
  }
}
```

#### 获取当前用户的菜单树
**接口**：`GET /api/auth/menus`

**业务逻辑**：
1. 获取用户所有权限
2. 筛选出 type = 'menu' 的权限
3. 构建树形菜单结构
4. 按 sort 排序
5. 返回菜单树

**响应格式**：
```
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "系统管理",
      "path": "/system",
      "icon": "SettingOutlined",
      "children": [
        {
          "id": 2,
          "name": "管理员管理",
          "path": "/system/admin",
          "component": "/system/admin/index",
          "icon": "UserOutlined"
        }
      ]
    }
  ]
}
```

### 4.6 权限验证中间件增强
- 在 `PermissionsGuard` 中实现权限验证逻辑
- 从请求中获取用户信息
- 获取接口所需权限（通过 `@Permissions()` 装饰器）
- 验证用户是否拥有该权限
- 超级管理员跳过权限验证

### 4.7 超级管理员判断
- 添加工具函数判断是否为超级管理员
- 判断条件：group_id = 1 或其他标识
- 超级管理员拥有所有权限

## 前端实现

### 5.1 权限 Store
- 创建 `src/store/permission.store.ts`
- 管理状态：
  - `permissions`：用户权限列表（code 数组）
  - `menus`：菜单树
  - `routes`：动态路由
- 管理 actions：
  - `fetchPermissions()`：获取用户权限
  - `fetchMenus()`：获取菜单树
  - `hasPermission(code)`：判断是否有某权限
  - `hasAnyPermission(codes)`：判断是否有任一权限

### 5.2 权限工具函数
创建 `src/utils/permission.ts`：
- `checkPermission(code)`：检查是否有权限
- `filterMenusByPermission(menus, permissions)`：根据权限过滤菜单

### 5.3 动态路由生成
**登录成功后**：
1. 获取用户菜单树
2. 根据菜单生成前端路由配置
3. 动态添加路由到 react-router
4. 菜单与路由映射：
   - menu.path → route.path
   - menu.component → 动态导入组件

**路由懒加载**：
- 使用 React.lazy 和 Suspense
- 组件路径映射（如：`/system/admin/index` → `import('@/pages/system/admin')`）

### 5.4 侧边栏菜单渲染
- 创建 `src/components/SideMenu.tsx`
- 根据 menus 数据渲染 Antd Menu 组件
- 支持多级菜单
- 图标映射（字符串 → Antd Icon 组件）
- 当前路由高亮
- 菜单折叠/展开

### 5.5 权限控制组件
创建 `src/components/PermissionGuard.tsx`：
```typescript
// 示例：根据权限显示/隐藏内容
<PermissionGuard permission="system:admin:create">
  <Button>新增</Button>
</PermissionGuard>

// 或使用 Hook
const hasPermission = usePermission('system:admin:edit');
```

### 5.6 按钮级权限控制
- 在列表页面的操作列中使用权限控制
- 新增按钮：需要 `xxx:create` 权限
- 编辑按钮：需要 `xxx:edit` 权限
- 删除按钮：需要 `xxx:delete` 权限
- 没有权限时隐藏按钮或禁用

### 5.7 权限管理页面开发
**路由**：`/system/permission`

**页面功能**：
- 显示权限树形表格（Antd Table tree）
- 新增权限（弹窗表单）
- 编辑权限（弹窗表单）
- 删除权限（确认对话框）
- 权限类型筛选
- 权限搜索

**表单字段**：
- 父权限选择（树形选择器）
- 权限名称
- 权限代码
- 权限类型（下拉选择）
- 路由路径（菜单类型必填）
- 图标选择（图标选择器）
- 排序
- 状态

### 5.8 Icon 图标选择器组件
- 创建图标选择器组件
- 展示 Antd 所有图标
- 支持搜索和选择
- 可预览选中图标

## 测试点

### 后端测试
- [ ] 查询权限树，数据结构正确
- [ ] 创建权限成功
- [ ] 更新权限成功
- [ ] 删除权限（无子权限时）成功
- [ ] 删除权限（有子权限时）失败
- [ ] 为角色分配权限成功
- [ ] 获取角色权限列表正确
- [ ] 获取用户权限列表正确
- [ ] 获取用户菜单树正确
- [ ] 超级管理员获取所有权限
- [ ] 权限守卫正确拦截无权限请求

### 前端测试
- [ ] 登录后自动获取菜单并渲染
- [ ] 侧边栏菜单显示正确
- [ ] 点击菜单正确跳转
- [ ] 权限控制组件正确显示/隐藏
- [ ] 按钮级权限控制生效
- [ ] 权限管理页面正常显示
- [ ] 可以新增/编辑/删除权限
- [ ] 图标选择器正常工作

## 验收标准

### 功能验收
- [ ] 管理员登录后能看到对应权限的菜单
- [ ] 超级管理员能看到所有菜单
- [ ] 没有权限的菜单不显示
- [ ] 没有权限的按钮不显示或禁用
- [ ] 直接访问无权限路由时提示或跳转
- [ ] 权限管理页面功能完整

### 数据验收
- [ ] 默认权限数据已正确初始化
- [ ] 超级管理员组关联了所有权限
- [ ] 权限树结构正确
- [ ] 角色权限关联表数据正确

## 注意事项

1. **权限粒度**：建议到按钮/接口级别，菜单权限作为导航控制
2. **权限命名规范**：使用冒号分隔，如 `system:admin:create`
3. **前端权限控制**：仅用于UI显示，真正的安全依赖后端验证
4. **动态路由**：注意路由刷新后的状态保持
5. **权限缓存**：考虑将权限列表缓存到 localStorage，减少请求
6. **权限变更**：用户权限变更后，需要刷新或重新登录生效

## 下一步预告
Step 05 将实现管理员管理模块（管理员的CRUD操作）
