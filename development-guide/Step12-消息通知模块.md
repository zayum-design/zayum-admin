# Step 12 - 消息通知模块

## 目标
实现站内消息和邮件通知功能,提供系统消息推送和邮件发送能力

## 后端实现

### 12.1 通知模块搭建
- 创建 `notification` 模块（controller、service、module）
- 创建邮件服务（email.service.ts）
- 创建通知相关 DTO

### 12.2 DTO 定义

#### CreateNotificationDto（创建通知）
**字段**：
- `user_type`：接收者类型（admin/user）
- `user_id`：接收者ID（必填）
- `type`：通知类型（system/message/email，默认 system）
- `title`：标题（必填，最多100字符）
- `content`：内容（必填，文本类型）
- `link`：关联链接（可选）

**验证规则**：
- user_id 必须存在
- title 和 content 必填

#### SendEmailDto（发送邮件）
**字段**：
- `to`：收件人邮箱（必填，或用户ID）
- `subject`：邮件主题（必填）
- `content`：邮件内容（必填，支持HTML）
- `attachments`：附件列表（可选）

#### QueryNotificationDto（查询参数）
**字段**：
- `page`：页码，默认1
- `pageSize`：每页数量，默认10
- `user_type`：接收者类型筛选
- `user_id`：接收者ID筛选
- `type`：通知类型筛选
- `is_read`：是否已读筛选
- `created_at_start`：创建时间开始
- `created_at_end`：创建时间结束

### 12.3 通知列表接口
**接口**：`GET /api/notifications`

**权限**：`message:list:view` 或当前用户

**查询参数**：参考 QueryNotificationDto

**业务逻辑**：
1. 如果不是管理员，只能查询自己的通知
2. 构建查询条件
3. 分页查询
4. 按创建时间倒序排序
5. 返回列表数据

**响应格式**：
```
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "user_type": "admin",
        "user_id": 1,
        "type": "system",
        "title": "系统更新通知",
        "content": "系统将于今晚23:00进行更新维护...",
        "link": "/system/update",
        "is_read": false,
        "read_at": null,
        "created_at": "2024-01-01 12:00:00"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 50,
      "totalPages": 5
    },
    "unread_count": 10
  }
}
```

### 12.4 获取当前用户未读通知数量接口
**接口**：`GET /api/notifications/unread-count`

**权限**：已登录

**业务逻辑**：
1. 从 token 获取当前用户信息
2. 查询该用户未读通知数量
3. 返回数量

**响应格式**：
```
{
  "code": 200,
  "data": {
    "unread_count": 5
  }
}
```

### 12.5 获取当前用户最新通知接口
**接口**：`GET /api/notifications/latest`

**权限**：已登录

**查询参数**：
- `limit`：获取数量，默认5

**业务逻辑**：
1. 从 token 获取当前用户信息
2. 查询该用户最新的 N 条通知
3. 返回通知列表

**用途**：
- 顶部通知下拉菜单展示

### 12.6 通知详情接口
**接口**：`GET /api/notifications/:id`

**权限**：`message:list:view` 或通知接收者本人

**业务逻辑**：
1. 查询通知详情
2. 验证权限（管理员或接收者本人）
3. 返回详情

### 12.7 创建通知接口
**接口**：`POST /api/notifications`

**权限**：`message:list:create` 或系统内部调用

**请求参数**：参考 CreateNotificationDto

**业务逻辑**：
1. DTO 验证
2. 验证接收者是否存在
3. 创建通知记录
4. 如果启用了实时推送，推送通知（WebSocket，可选）
5. 返回创建成功的通知

**使用场景**：
- 系统管理员发送系统通知
- 业务流程中自动发送通知（如：审批通过、任务分配等）

### 12.8 批量创建通知接口
**接口**：`POST /api/notifications/batch`

**权限**：`message:list:create`

**请求参数**：
- `user_ids`：接收者ID数组
- `user_type`：接收者类型
- `title`：标题
- `content`：内容
- `link`：关联链接

**业务逻辑**：
- 批量创建通知记录
- 支持发送给多个用户

### 12.9 标记通知已读接口
**接口**：`PATCH /api/notifications/:id/read`

**权限**：通知接收者本人

**业务逻辑**：
1. 查询通知
2. 验证是接收者本人
3. 如果已读，直接返回
4. 更新 is_read = true，read_at = 当前时间
5. 返回成功

### 12.10 批量标记已读接口
**接口**：`POST /api/notifications/mark-read`

**权限**：已登录

**请求参数**：
- `ids`：通知ID数组（可选，不传则标记全部未读为已读）

**业务逻辑**：
1. 如果传了 ids，标记指定通知为已读
2. 如果未传 ids，标记当前用户所有未读通知为已读
3. 仅允许标记自己的通知

### 12.11 删除通知接口
**接口**：`DELETE /api/notifications/:id`

**权限**：`message:list:delete` 或通知接收者本人

**业务逻辑**：
1. 查询通知
2. 验证权限
3. 删除通知
4. 返回成功

### 12.12 批量删除通知接口
**接口**：`DELETE /api/notifications/batch`

**权限**：已登录

**请求参数**：
- `ids`：通知ID数组

**业务逻辑**：
- 批量删除通知
- 仅允许删除自己的通知

### 12.13 邮件服务配置
**创建 email.service.ts**：
- 使用 nodemailer 库
- 从系统配置读取 SMTP 配置
- 支持发送文本邮件和 HTML 邮件
- 支持添加附件

**配置项**（从 sys_config 表读取）：
- `email_host`：SMTP服务器
- `email_port`：SMTP端口
- `email_username`：邮箱账号
- `email_password`：邮箱密码
- `email_from_name`：发件人名称

### 12.14 发送邮件接口
**接口**：`POST /api/notifications/send-email`

**权限**：`message:list:send-email` 或系统内部调用

**请求参数**：参考 SendEmailDto

**业务逻辑**：
1. DTO 验证
2. 如果传了用户ID，查询用户邮箱
3. 读取邮件配置
4. 发送邮件
5. 记录发送日志（可选）
6. 返回发送结果

**错误处理**：
- 邮箱配置未设置：500
- 收件人邮箱无效：400
- SMTP连接失败：500
- 发送失败：500

### 12.15 邮件模板功能（可选）
- 创建邮件模板表或文件
- 支持模板变量替换（如：{{username}}、{{link}}）
- 提供常用模板：注册欢迎、密码重置、系统通知等

**模板示例**：
```html
<h2>欢迎注册</h2>
<p>尊敬的 {{username}}：</p>
<p>感谢您注册我们的系统...</p>
<p><a href="{{link}}">立即登录</a></p>
```

### 12.16 测试邮件功能
**接口**：`POST /api/notifications/test-email`

**权限**：`system:config:edit`

**请求参数**：
- `to`：测试邮箱地址

**业务逻辑**：
1. 读取邮件配置
2. 发送测试邮件
3. 返回发送结果

### 12.17 实时通知推送（可选，WebSocket）
- 使用 WebSocket 或 Socket.IO
- 用户登录后建立 WebSocket 连接
- 收到新通知时实时推送给前端
- 前端收到后更新通知数量和列表

## 前端实现

### 13.1 通知中心页面
**路由**：`/message/list`

**页面结构**：
- Tab切换（全部、未读、已读）
- 通知列表
- 分页器

### 13.2 通知列表展示
**列表项内容**：
- 通知图标（根据类型显示不同图标）
- 通知标题（粗体，未读时显示红点）
- 通知内容（灰色，显示部分内容）
- 通知时间（相对时间：刚刚、5分钟前、1小时前）
- 操作按钮（标记已读、删除）

**交互**：
- 点击通知项：
  - 标记为已读
  - 如果有 link，跳转到对应页面
  - 或展开查看完整内容

### 13.3 顶部通知下拉菜单
**位置**：顶部导航栏

**触发**：点击通知图标（Bell Icon）

**内容**：
- 未读通知数量徽标（Badge）
- 下拉菜单显示最新5条通知
- "查看全部"链接（跳转到通知中心）
- "全部标记已读"按钮

**实现**：
- 使用 Antd Dropdown + Badge
- 通知列表项样式简洁

### 13.4 未读通知数量
**获取方式**：
1. 登录后立即获取未读数量
2. 定时轮询（每30秒或1分钟）
3. 或使用 WebSocket 实时更新

**显示位置**：
- 顶部通知图标的徽标
- 侧边栏"消息通知"菜单项徽标（可选）

### 13.5 标记已读功能
**单个标记**：
- 点击通知项自动标记已读
- 或显示"标记已读"按钮

**批量标记**：
- "全部标记已读"按钮
- 或多选后批量标记

### 13.6 删除通知功能
**单个删除**：
- 通知项右侧显示删除按钮（图标或文字）
- 点击确认后删除

**批量删除**：
- 多选通知
- 点击"批量删除"按钮

### 13.7 通知筛选
**Tab切换**：
- 全部
- 未读
- 已读

**类型筛选**（可选）：
- 系统通知
- 消息通知
- 邮件通知

### 13.8 通知详情
**触发**：点击通知项

**实现方式**：抽屉或对话框

**显示内容**：
- 通知标题
- 通知内容（完整显示，支持富文本）
- 关联链接（如有）
- 发送时间
- 操作按钮（标记已读、删除）

### 13.9 发送通知页面（管理员）
**路由**：`/message/send`

**权限**：`message:list:create`

**表单字段**：
- 接收者类型（Radio：管理员/用户）
- 接收者选择（Select，多选，可搜索）
- 通知类型（Select：系统通知/消息）
- 通知标题（Input）
- 通知内容（TextArea 或富文本编辑器）
- 关联链接（Input）

**提交流程**：
1. 表单验证
2. 调用批量创建通知接口
3. 成功后提示并清空表单

### 13.10 发送邮件页面（管理员，可选）
**路由**：`/message/send-email`

**权限**：`message:list:send-email`

**表单字段**：
- 收件人（Input，支持多个邮箱，逗号分隔）
- 或选择用户（Select，多选）
- 邮件主题（Input）
- 邮件内容（富文本编辑器）
- 附件（Upload）

**提交流程**：
1. 表单验证
2. 调用发送邮件接口
3. 显示发送进度
4. 成功后提示

### 13.11 WebSocket 集成（可选）
**连接管理**：
- 登录后建立 WebSocket 连接
- 监听新通知事件
- 收到新通知后：
  - 更新未读数量
  - 弹出通知提示（Antd notification）
  - 更新通知列表（如果在通知页面）

**断线重连**：
- 连接断开后自动重连
- 重连后重新订阅通知

### 13.12 通知提示（Toast）
**触发**：收到新通知时

**实现方式**：使用 Antd notification 组件

**内容**：
- 通知标题
- 通知内容（简短）
- 操作按钮（查看、忽略）

**位置**：右上角

### 13.13 API Service
创建 `src/services/notification.service.ts`：
- `getNotificationList(params)`：获取通知列表
- `getUnreadCount()`：获取未读数量
- `getLatestNotifications(limit)`：获取最新通知
- `getNotificationDetail(id)`：获取通知详情
- `createNotification(data)`：创建通知
- `batchCreateNotifications(data)`：批量创建通知
- `markAsRead(id)`：标记已读
- `batchMarkAsRead(ids)`：批量标记已读
- `deleteNotification(id)`：删除通知
- `batchDeleteNotifications(ids)`：批量删除
- `sendEmail(data)`：发送邮件
- `testEmail(to)`：测试邮件

### 13.14 通知 Store
创建 `src/store/notification.store.ts`：
- `unreadCount`：未读数量
- `latestNotifications`：最新通知列表
- `fetchUnreadCount()`：获取未读数量
- `fetchLatestNotifications()`：获取最新通知
- `markAsRead(id)`：标记已读
- `decrementUnreadCount()`：减少未读数量

### 13.15 组件拆分
建议拆分组件：
- `NotificationCenter.tsx`：通知中心页面
- `NotificationList.tsx`：通知列表
- `NotificationItem.tsx`：通知列表项
- `NotificationDropdown.tsx`：顶部通知下拉菜单
- `NotificationDetail.tsx`：通知详情抽屉
- `SendNotificationForm.tsx`：发送通知表单
- `SendEmailForm.tsx`：发送邮件表单

## 测试点

### 后端测试
- [ ] 获取通知列表，分页正确
- [ ] 获取未读数量正确
- [ ] 获取最新通知正确
- [ ] 创建通知成功
- [ ] 批量创建通知成功
- [ ] 标记已读成功
- [ ] 批量标记已读成功
- [ ] 删除通知成功
- [ ] 非本人无法操作他人通知
- [ ] 发送邮件成功
- [ ] 邮件配置错误时返回错误
- [ ] 测试邮件功能正常

### 前端测试
- [ ] 通知列表正常显示
- [ ] 未读数量正确显示
- [ ] 顶部下拉菜单正常
- [ ] 点击通知自动标记已读
- [ ] 全部标记已读功能正常
- [ ] 删除通知成功
- [ ] 批量删除成功
- [ ] 通知筛选正常
- [ ] 发送通知功能正常
- [ ] 发送邮件功能正常
- [ ] WebSocket实时推送正常（如实现）

## 验收标准

### 功能验收
- [ ] 站内通知功能完整
- [ ] 邮件发送功能正常
- [ ] 未读数量实时更新
- [ ] 通知操作流畅

### 数据验收
- [ ] 通知数据正确保存
- [ ] 已读状态正确更新
- [ ] 邮件发送记录完整

### 用户体验
- [ ] 通知提示友好
- [ ] 通知列表清晰
- [ ] 操作便捷
- [ ] 实时性好（如使用WebSocket）

## 注意事项

1. **性能优化**：
   - 未读数量查询频繁，考虑缓存
   - 通知列表分页加载
   - WebSocket连接数控制

2. **邮件发送**：
   - 异步发送，避免阻塞
   - 发送失败重试机制
   - 邮件队列（可选，使用 Bull 等）

3. **安全性**：
   - 用户只能操作自己的通知
   - 防止邮件被滥用（频率限制）
   - 邮箱密码加密存储

4. **实时性**：
   - 定时轮询间隔合理（不要太频繁）
   - WebSocket优于轮询
   - 考虑服务端推送（SSE）

5. **通知内容**：
   - 支持富文本（可选）
   - 内容长度限制
   - XSS 防护

## 下一步预告
Step 13 将实现个人中心模块（个人信息管理、密码修改、偏好设置）
