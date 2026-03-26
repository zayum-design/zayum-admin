# Step 02 - 数据库表设计与实体创建

## 目标
完成所有核心表的设计与实体类创建，建立数据库基础架构

## 数据库表设计

### 2.1 管理员表（sys_admin）
**字段设计**：
- `id`：主键，自增
- `group_id`：管理员组ID，默认1
- `username`：用户名，唯一，长度20
- `nickname`：昵称，长度50
- `password`：密码（加密存储），长度128
- `avatar`：头像URL，长度255
- `email`：邮箱，唯一，长度100
- `mobile`：手机号，唯一，长度11
- `login_failure`：登录失败次数，默认0
- `login_at`：最后登录时间
- `login_ip`：登录IP，长度50
- `token`：当前登录令牌，长度512
- `status`：状态（normal/hidden），默认normal
- `created_at`：创建时间
- `updated_at`：更新时间

**索引**：
- 主键索引：id
- 唯一索引：username、email、mobile
- 普通索引：group_id、status

**初始数据**：
- 用户名：admin
- 密码：Admin@888888（需加密）
- 邮箱：admin@example.com
- 手机号：13800138000
- 昵称：超级管理员
- 管理员组ID：1

### 2.2 管理员组表（sys_admin_group）
**字段设计**：
- `id`：主键，自增
- `name`：组名，唯一，长度50
- `description`：描述，长度200
- `permissions`：权限列表（JSON 或关联表）
- `status`：状态（normal/hidden），默认normal
- `created_at`：创建时间
- `updated_at`：更新时间

**初始数据**：
- ID 1：超级管理员组（拥有所有权限）

### 2.3 用户表（sys_user）
**字段设计**：
- `id`：主键，自增
- `group_id`：用户组ID，默认1
- `username`：用户名，唯一，长度20
- `nickname`：昵称，长度50
- `password`：密码（加密存储），长度128
- `avatar`：头像URL，长度255
- `email`：邮箱，唯一，长度100
- `mobile`：手机号，唯一，长度11
- `gender`：性别（male/female/unknown），默认unknown
- `birthday`：生日
- `status`：状态（normal/hidden/locked），默认normal
- `created_at`：创建时间
- `updated_at`：更新时间

### 2.4 用户组表（sys_user_group）
**字段设计**：
- `id`：主键，自增
- `name`：组名，唯一，长度50
- `description`：描述，长度200
- `permissions`：权限列表（JSON 或关联表）
- `status`：状态（normal/hidden），默认normal
- `created_at`：创建时间
- `updated_at`：更新时间

### 2.5 权限表（sys_permission）
**字段设计**：
- `id`：主键，自增
- `parent_id`：父权限ID，默认0（顶级权限）
- `name`：权限名称，长度50
- `code`：权限代码（唯一标识），长度100
- `type`：类型（menu/button/api），默认menu
- `path`：路由路径（菜单权限用），长度200
- `icon`：图标（菜单权限用），长度50
- `component`：组件路径（菜单权限用），长度200
- `sort`：排序，默认0
- `status`：状态（normal/hidden），默认normal
- `created_at`：创建时间
- `updated_at`：更新时间

### 2.6 角色权限关联表（sys_role_permission）
**字段设计**：
- `id`：主键，自增
- `role_type`：角色类型（admin_group/user_group）
- `role_id`：角色ID（管理员组ID或用户组ID）
- `permission_id`：权限ID
- `created_at`：创建时间

**联合唯一索引**：role_type + role_id + permission_id

### 2.7 操作日志表（sys_operation_log）
**字段设计**：
- `id`：主键，自增
- `user_type`：用户类型（admin/user）
- `user_id`：用户ID
- `username`：用户名，长度50
- `module`：模块名称，长度50
- `action`：操作动作，长度50
- `method`：请求方法（GET/POST/PUT/DELETE等），长度10
- `url`：请求URL，长度500
- `params`：请求参数（JSON），文本类型
- `ip`：操作IP，长度50
- `user_agent`：用户代理，长度500
- `status`：操作状态（success/failure），默认success
- `error_msg`：错误信息，长度500
- `duration`：执行时长（毫秒）
- `created_at`：创建时间

**索引**：user_type、user_id、created_at、status

### 2.8 登录日志表（sys_login_log）
**字段设计**：
- `id`：主键，自增
- `user_type`：用户类型（admin/user）
- `user_id`：用户ID
- `username`：用户名，长度50
- `ip`：登录IP，长度50
- `location`：登录地点，长度100
- `browser`：浏览器信息，长度100
- `os`：操作系统，长度100
- `status`：登录状态（success/failure），默认success
- `message`：登录消息，长度200
- `created_at`：创建时间

**索引**：user_type、user_id、created_at、status

### 2.9 系统配置表（sys_config）
**字段设计**：
- `id`：主键，自增
- `category`：配置分类，长度50
- `key`：配置键（唯一），长度100
- `value`：配置值，文本类型
- `description`：描述，长度200
- `type`：数据类型（string/number/boolean/json），默认string
- `is_public`：是否公开（客户端可访问），布尔值，默认false
- `sort`：排序，默认0
- `created_at`：创建时间
- `updated_at`：更新时间

**唯一索引**：key

### 2.10 文件上传表（sys_upload）
**字段设计**：
- `id`：主键，自增
- `user_type`：上传者类型（admin/user）
- `user_id`：上传者ID
- `category`：文件分类（avatar/attachment/image等），长度50
- `filename`：原始文件名，长度200
- `filepath`：存储路径，长度500
- `filesize`：文件大小（字节）
- `mimetype`：MIME类型，长度100
- `extension`：文件扩展名，长度10
- `url`：访问URL，长度500
- `created_at`：创建时间

**索引**：user_type、user_id、category、created_at

### 2.11 消息通知表（sys_notification）
**字段设计**：
- `id`：主键，自增
- `user_type`：接收者类型（admin/user）
- `user_id`：接收者ID
- `type`：通知类型（system/message/email），默认system
- `title`：标题，长度100
- `content`：内容，文本类型
- `link`：关联链接，长度500
- `is_read`：是否已读，布尔值，默认false
- `read_at`：阅读时间
- `created_at`：创建时间

**索引**：user_type、user_id、is_read、created_at

## 后端实体创建

### 3.1 创建实体类
为每个表创建对应的 Entity 类（TypeORM）或 Schema（Mongoose）

### 3.2 实体关系配置
- 管理员 ↔ 管理员组：多对一
- 用户 ↔ 用户组：多对一
- 管理员组/用户组 ↔ 权限：多对多（通过 sys_role_permission）
- 权限：自关联（树形结构）

### 3.3 数据库迁移
- 创建迁移文件
- 执行迁移，生成所有表结构
- 验证表创建成功

### 3.4 数据填充（Seeder）
- 创建数据填充脚本
- 插入超级管理员数据（admin/Admin@888888，密码需 bcrypt 加密）
- 插入超级管理员组数据
- 插入默认权限数据（菜单权限）
- 执行填充脚本

## 前端类型定义

### 4.1 创建 TypeScript 类型
在 `src/types` 目录下创建对应的类型定义文件：
- `admin.types.ts`：管理员相关类型
- `user.types.ts`：用户相关类型
- `permission.types.ts`：权限相关类型
- `log.types.ts`：日志相关类型
- `config.types.ts`：配置相关类型
- `upload.types.ts`：上传相关类型
- `notification.types.ts`：通知相关类型
- `common.types.ts`：公共类型（分页、响应等）

### 4.2 类型定义规范
- 与后端实体字段保持一致
- 定义请求 DTO 类型
- 定义响应 DTO 类型
- 定义查询参数类型

## 验收标准

### 后端验收
- [ ] 所有表已成功创建
- [ ] 所有实体类已创建且无语法错误
- [ ] 数据库迁移执行成功
- [ ] 超级管理员数据已插入（密码已加密）
- [ ] 可通过数据库客户端查看所有表和数据
- [ ] 实体关系配置正确

### 前端验收
- [ ] 所有类型定义文件已创建
- [ ] 类型定义与后端实体一致
- [ ] TypeScript 编译无错误

### 数据验证
- [ ] 登录数据库，验证 sys_admin 表存在
- [ ] 查询管理员数据，确认 admin 用户存在
- [ ] 验证密码已正确加密（bcrypt 哈希）
- [ ] 验证所有表的索引已创建

## 注意事项

1. **密码加密**：使用 bcrypt，加密轮数建议 10
2. **时间字段**：统一使用数据库时间戳，自动更新
3. **软删除**：考虑是否需要软删除（deleted_at 字段）
4. **字符集**：确保数据库使用 UTF8MB4 字符集
5. **外键约束**：根据实际需求决定是否使用外键约束
6. **枚举类型**：后端使用 TypeScript 枚举，保持一致性

## 下一步预告
Step 03 将实现用户认证与授权系统（JWT + 登录/登出功能）
