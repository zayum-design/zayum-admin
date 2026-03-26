# Step 06 - 管理员组管理模块

## 目标
实现管理员组的CRUD操作和权限分配功能，完善RBAC权限系统

## 后端实现

### 6.1 管理员组模块搭建
- 创建 `admin-group` 模块（controller、service、module）
- 创建相关 DTO（CreateAdminGroupDto、UpdateAdminGroupDto、QueryAdminGroupDto、AssignPermissionsDto）

### 6.2 DTO 定义

#### QueryAdminGroupDto（查询参数）
**字段**：
- `page`：页码，默认1
- `pageSize`：每页数量，默认10
- `name`：组名（模糊搜索）
- `status`：状态筛选

#### CreateAdminGroupDto（创建管理员组）
**字段**：
- `name`：组名（必填，唯一，2-50字符）
- `description`：描述（可选，最多200字符）
- `status`：状态（默认 normal）

**验证规则**：
- name 必填且唯一
- description 长度限制

#### UpdateAdminGroupDto（更新管理员组）
**字段**：
- 与 CreateAdminGroupDto 类似，都是可选字段

#### AssignPermissionsDto（分配权限）
**字段**：
- `permission_ids`：权限ID数组（必填）

**验证规则**：
- 数组不能为空
- 权限ID必须存在

### 6.3 管理员组列表接口
**接口**：`GET /api/admin-groups`

**权限**：`system:admin-group:view`

**查询参数**：参考 QueryAdminGroupDto

**业务逻辑**：
1. 构建查询条件
2. 分页查询
3. 统计每个组的管理员数量（可选，通过子查询或聚合）
4. 返回列表数据和分页信息

**响应格式**：
```
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "name": "超级管理员组",
        "description": "拥有系统所有权限",
        "status": "normal",
        "admin_count": 1,
        "created_at": "2024-01-01 00:00:00",
        "updated_at": "2024-01-01 00:00:00"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### 6.4 管理员组详情接口
**接口**：`GET /api/admin-groups/:id`

**权限**：`system:admin-group:view`

**业务逻辑**：
1. 根据 ID 查询管理员组
2. 统计该组的管理员数量
3. 查询该组拥有的权限列表
4. 管理员组不存在时返回 404

**响应格式**：
```
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "超级管理员组",
    "description": "拥有系统所有权限",
    "status": "normal",
    "admin_count": 1,
    "permissions": [
      {
        "id": 1,
        "name": "系统管理",
        "code": "system"
      }
    ],
    "created_at": "2024-01-01 00:00:00",
    "updated_at": "2024-01-01 00:00:00"
  }
}
```

### 6.5 创建管理员组接口
**接口**：`POST /api/admin-groups`

**权限**：`system:admin-group:create`

**请求参数**：参考 CreateAdminGroupDto

**业务逻辑**：
1. DTO 验证
2. 检查组名是否已存在
3. 创建管理员组记录
4. 记录操作日志
5. 返回创建成功的管理员组信息

**错误处理**：
- 组名已存在：400

### 6.6 更新管理员组接口
**接口**：`PUT /api/admin-groups/:id`

**权限**：`system:admin-group:edit`

**请求参数**：参考 UpdateAdminGroupDto

**业务逻辑**：
1. DTO 验证
2. 检查管理员组是否存在
3. 如果修改组名，检查新组名是否被占用
4. 不允许修改超级管理员组（ID=1）的某些字段（可选安全策略）
5. 更新管理员组记录
6. 记录操作日志
7. 返回更新后的管理员组信息

### 6.7 删除管理员组接口
**接口**：`DELETE /api/admin-groups/:id`

**权限**：`system:admin-group:delete`

**业务逻辑**：
1. 检查管理员组是否存在
2. 不允许删除超级管理员组（ID=1）
3. 检查该组下是否有管理员
   - 如果有，提示需要先移除或转移管理员
   - 或提供强制删除选项（将管理员移至默认组）
4. 删除该组的权限关联（sys_role_permission 表）
5. 删除管理员组记录
6. 记录操作日志
7. 返回成功消息

### 6.8 获取管理员组权限接口
**接口**：`GET /api/admin-groups/:id/permissions`

**权限**：`system:admin-group:view`

**业务逻辑**：
1. 查询 sys_role_permission 表
2. 获取该管理员组的所有权限ID
3. 查询权限详细信息
4. 构建权限树（可选）
5. 返回权限列表

**响应格式**：
```
{
  "code": 200,
  "data": {
    "permission_ids": [1, 2, 3, 5, 6],
    "permissions": [
      {
        "id": 1,
        "name": "系统管理",
        "code": "system",
        "type": "menu"
      }
    ]
  }
}
```

### 6.9 分配权限接口
**接口**：`POST /api/admin-groups/:id/permissions`

**权限**：`system:admin-group:edit`

**请求参数**：参考 AssignPermissionsDto

**业务逻辑**：
1. 验证管理员组是否存在
2. 验证所有权限ID是否存在
3. 不允许修改超级管理员组的权限（可选）
4. 使用事务处理：
   - 删除该组原有的所有权限关联
   - 批量插入新的权限关联
   - 提交事务
5. 记录操作日志
6. 清除该组所有管理员的权限缓存（如有）
7. 返回成功消息

**响应格式**：
```
{
  "code": 200,
  "message": "权限分配成功"
}
```

### 6.10 获取管理员组下的管理员列表
**接口**：`GET /api/admin-groups/:id/admins`

**权限**：`system:admin-group:view`

**业务逻辑**：
1. 查询该管理员组下的所有管理员
2. 支持分页
3. 返回管理员列表

### 6.11 批量操作接口（可选）
- 批量删除管理员组
- 批量修改状态

## 前端实现

### 7.1 管理员组管理页面
**路由**：`/system/admin-group`

**页面结构**：
- 搜索区域（组名搜索、状态筛选）
- 操作按钮区（新增管理员组）
- 数据表格
- 分页器

### 7.2 数据表格
**表格列**：
- 序号
- 组名
- 描述
- 管理员数量（可点击查看管理员列表）
- 状态（Tag 组件）
- 创建时间
- 更新时间
- 操作（按钮组）

**操作按钮**：
- 权限设置（权限：system:admin-group:edit）
- 编辑（权限：system:admin-group:edit）
- 删除（权限：system:admin-group:delete）

### 7.3 新增管理员组
**触发**：点击"新增管理员组"按钮

**实现方式**：对话框或抽屉

**表单字段**：
- 组名（必填，Input）
- 描述（可选，TextArea）
- 状态（Radio，默认 normal）

**提交流程**：
1. 表单验证
2. 调用创建接口
3. 成功后关闭表单并刷新列表

### 7.4 编辑管理员组
**触发**：点击表格行的"编辑"按钮

**实现方式**：对话框或抽屉

**表单字段**：
- 与新增类似，预填充当前管理员组数据

**特殊处理**：
- 超级管理员组（ID=1）可能需要禁用某些字段

### 7.5 删除管理员组
**触发**：点击表格行的"删除"按钮

**实现方式**：确认对话框

**确认提示**：
```
确定要删除管理员组 "xxx" 吗？该组下还有 N 个管理员。
```

**提交流程**：
1. 检查该组是否有管理员
2. 如果有管理员，提示用户先移除管理员
3. 确认后调用删除接口

### 7.6 权限设置功能
**触发**：点击表格行的"权限设置"按钮

**实现方式**：抽屉（Drawer，宽度较大）

**页面布局**：
- 左侧：权限树（Tree 组件）
- 右侧：管理员组信息摘要

**权限树功能**：
- 显示所有权限的树形结构
- 支持勾选/取消勾选（Checkbox）
- 支持全选/反选
- 支持展开/折叠所有节点
- 支持按类型筛选（菜单/按钮/接口）
- 支持搜索权限

**权限树实现**：
- 使用 Antd Tree 组件
- checkable 属性开启复选框
- checkedKeys 绑定已选权限ID
- 父子节点关联（选中父节点自动选中所有子节点）

**数据加载**：
1. 打开抽屉时调用两个接口：
   - 获取所有权限树
   - 获取该管理员组已有的权限ID列表
2. 设置 Tree 的 checkedKeys

**保存流程**：
1. 获取当前选中的所有权限ID（包括半选的父节点）
2. 调用分配权限接口
3. 成功后提示并关闭抽屉
4. 刷新列表（可选）

### 7.7 查看管理员列表
**触发**：点击管理员数量

**实现方式**：对话框或抽屉

**内容**：
- 显示该管理员组下所有管理员的表格
- 支持分页
- 可跳转到管理员详情（可选）

### 7.8 权限树组件封装
创建 `src/components/PermissionTree.tsx`：
- 接收 props：
  - `permissions`：权限树数据
  - `checkedKeys`：已选权限ID
  - `onChange`：选择变化回调
  - `readonly`：是否只读
- 功能：
  - 渲染树形结构
  - 复选框交互
  - 搜索过滤
  - 全选/反选

### 7.9 API Service
创建 `src/services/admin-group.service.ts`：
- `getAdminGroupList(params)`：获取管理员组列表
- `getAdminGroupDetail(id)`：获取管理员组详情
- `createAdminGroup(data)`：创建管理员组
- `updateAdminGroup(id, data)`：更新管理员组
- `deleteAdminGroup(id)`：删除管理员组
- `getAdminGroupPermissions(id)`：获取管理员组权限
- `assignAdminGroupPermissions(id, permissionIds)`：分配权限
- `getAdminGroupAdmins(id, params)`：获取管理员组下的管理员

### 7.10 组件拆分
建议拆分组件：
- `AdminGroupList.tsx`：主页面
- `AdminGroupTable.tsx`：数据表格
- `AdminGroupForm.tsx`：新增/编辑表单
- `AdminGroupPermissionDrawer.tsx`：权限设置抽屉
- `AdminGroupAdminsModal.tsx`：管理员列表对话框

## 测试点

### 后端测试
- [ ] 获取管理员组列表，分页正确
- [ ] 创建管理员组成功
- [ ] 创建管理员组时组名重复，返回错误
- [ ] 更新管理员组成功
- [ ] 删除管理员组成功（无管理员时）
- [ ] 删除管理员组时有管理员，返回错误或提示
- [ ] 删除超级管理员组时返回错误
- [ ] 获取管理员组权限成功
- [ ] 分配权限成功，权限关联表数据正确
- [ ] 分配权限后，该组管理员的权限立即生效
- [ ] 操作日志正确记录

### 前端测试
- [ ] 管理员组列表正常显示
- [ ] 搜索功能正常
- [ ] 新增管理员组成功
- [ ] 编辑管理员组成功
- [ ] 删除管理员组成功
- [ ] 权限设置抽屉正常打开
- [ ] 权限树正确显示和选择
- [ ] 保存权限成功
- [ ] 权限树的父子节点联动正常
- [ ] 搜索权限功能正常
- [ ] 查看管理员列表功能正常

## 验收标准

### 功能验收
- [ ] 管理员组的所有CRUD操作正常
- [ ] 权限分配功能完整可用
- [ ] 权限树交互流畅
- [ ] 数据校验严格
- [ ] 超级管理员组受到保护

### 数据验收
- [ ] 管理员组数据正确保存
- [ ] 权限关联数据正确
- [ ] 管理员组删除时权限关联也被清除
- [ ] 操作日志完整

### 用户体验
- [ ] 权限设置界面直观易用
- [ ] 权限树支持搜索和快速操作
- [ ] 操作有明确反馈
- [ ] 错误提示友好

## 注意事项

1. **权限更新时效性**：
   - 分配权限后，考虑是否需要强制该组管理员重新登录
   - 或实现权限实时刷新机制

2. **超级管理员组保护**：
   - 不允许删除
   - 权限不允许修改（或谨慎操作）
   - 确保至少有一个超级管理员

3. **权限树性能**：
   - 权限数量多时，考虑虚拟滚动
   - 懒加载子节点（可选）

4. **级联删除**：
   - 明确删除管理员组时，该组下管理员的处理策略
   - 是否允许强制删除并转移管理员

5. **权限继承**：
   - 当前设计是直接授权，不涉及继承
   - 如需支持继承，需调整数据结构和逻辑

## 下一步预告
Step 07 将实现用户管理模块（普通用户的CRUD操作）
