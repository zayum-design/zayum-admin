# Step 10 - 系统配置管理模块

## 目标
实现系统配置项的CRUD操作，支持前端动态读取配置，实现灵活的系统参数管理

## 后端实现

### 10.1 配置模块搭建
- 创建 `config` 模块（controller、service、module）
- 创建配置相关 DTO（CreateConfigDto、UpdateConfigDto、QueryConfigDto）

### 10.2 DTO 定义

#### QueryConfigDto（查询参数）
**字段**：
- `page`：页码，默认1
- `pageSize`：每页数量，默认10
- `category`：配置分类筛选
- `key`：配置键（模糊搜索）
- `is_public`：是否公开（true/false）

#### CreateConfigDto（创建配置）
**字段**：
- `category`：配置分类（必填，如：system/email/upload/notification）
- `key`：配置键（必填，唯一，如：site_name、upload_max_size）
- `value`：配置值（必填）
- `description`：描述（可选）
- `type`：数据类型（string/number/boolean/json，默认 string）
- `is_public`：是否公开（布尔值，默认 false）
- `sort`：排序（默认 0）

**验证规则**：
- key 必须唯一
- type 为 json 时，value 必须是有效的 JSON

#### UpdateConfigDto（更新配置）
**字段**：
- 与 CreateConfigDto 类似，key 不可修改，其他字段可选

### 10.3 配置列表接口
**接口**：`GET /api/configs`

**权限**：`system:config:view`

**查询参数**：参考 QueryConfigDto

**业务逻辑**：
1. 构建查询条件
2. 分页查询
3. 按 category 和 sort 排序
4. 返回列表数据和分页信息

**响应格式**：
```
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "category": "system",
        "key": "site_name",
        "value": "管理系统",
        "description": "网站名称",
        "type": "string",
        "is_public": true,
        "sort": 1,
        "created_at": "2024-01-01 00:00:00",
        "updated_at": "2024-01-01 00:00:00"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

### 10.4 配置详情接口
**接口**：`GET /api/configs/:id`

**权限**：`system:config:view`

**业务逻辑**：
1. 根据 ID 查询配置
2. 配置不存在时返回 404

### 10.5 根据键获取配置接口
**接口**：`GET /api/configs/by-key/:key`

**权限**：`system:config:view` 或公开（is_public=true）

**业务逻辑**：
1. 根据 key 查询配置
2. 如果 is_public=false，需要验证权限
3. 返回配置值

**响应格式**：
```
{
  "code": 200,
  "data": {
    "key": "site_name",
    "value": "管理系统",
    "type": "string"
  }
}
```

### 10.6 批量获取公开配置接口
**接口**：`GET /api/configs/public`

**权限**：无需权限（公开接口）

**业务逻辑**：
1. 查询所有 is_public=true 的配置
2. 返回键值对

**响应格式**：
```
{
  "code": 200,
  "data": {
    "site_name": "管理系统",
    "site_logo": "https://...",
    "site_description": "...",
    "upload_max_size": 10485760,
    "allowed_file_types": ["jpg", "png", "pdf"]
  }
}
```

### 10.7 创建配置接口
**接口**：`POST /api/configs`

**权限**：`system:config:create`

**请求参数**：参考 CreateConfigDto

**业务逻辑**：
1. DTO 验证
2. 检查 key 是否已存在
3. 如果 type 为 json，验证 value 是有效的 JSON
4. 创建配置记录
5. 记录操作日志
6. 清除配置缓存（如有）
7. 返回创建成功的配置信息

**错误处理**：
- key 已存在：400
- JSON 格式错误：400

### 10.8 更新配置接口
**接口**：`PUT /api/configs/:id`

**权限**：`system:config:edit`

**请求参数**：参考 UpdateConfigDto

**业务逻辑**：
1. DTO 验证
2. 检查配置是否存在
3. 不允许修改 key
4. 如果修改 value 且 type 为 json，验证 JSON 格式
5. 更新配置记录
6. 记录操作日志
7. 清除配置缓存
8. 返回更新后的配置信息

### 10.9 删除配置接口
**接口**：`DELETE /api/configs/:id`

**权限**：`system:config:delete`

**业务逻辑**：
1. 检查配置是否存在
2. 不允许删除系统关键配置（可选保护策略）
3. 删除配置记录
4. 记录操作日志
5. 清除配置缓存
6. 返回成功消息

### 10.10 批量更新配置接口
**接口**：`PUT /api/configs/batch`

**权限**：`system:config:edit`

**请求参数**：
```
{
  "configs": [
    { "key": "site_name", "value": "新名称" },
    { "key": "upload_max_size", "value": "10485760" }
  ]
}
```

**业务逻辑**：
1. 验证所有配置键存在
2. 使用事务批量更新
3. 记录操作日志
4. 清除配置缓存
5. 返回成功消息

### 10.11 配置分类列表接口
**接口**：`GET /api/configs/categories`

**权限**：`system:config:view`

**业务逻辑**：
1. 查询所有不同的 category
2. 统计每个分类的配置数量
3. 返回分类列表

**响应格式**：
```
{
  "code": 200,
  "data": [
    { "category": "system", "count": 10 },
    { "category": "email", "count": 5 },
    { "category": "upload", "count": 3 }
  ]
}
```

### 10.12 配置缓存机制（可选但推荐）
- 使用 Redis 缓存配置数据
- 读取配置时先查缓存，缓存未命中再查数据库
- 更新/删除配置时清除对应缓存
- 设置缓存过期时间（如：1小时）

### 10.13 配置初始化
**创建默认配置数据**：

**系统配置（system）**：
- `site_name`：网站名称
- `site_logo`：网站Logo
- `site_description`：网站描述
- `site_keywords`：网站关键词
- `site_copyright`：版权信息

**上传配置（upload）**：
- `upload_max_size`：最大上传大小（字节），如：10485760（10MB）
- `allowed_file_types`：允许的文件类型（JSON数组），如：["jpg","png","pdf"]
- `upload_path`：上传路径
- `avatar_max_size`：头像最大大小（字节）

**邮件配置（email）**：
- `email_host`：SMTP服务器
- `email_port`：SMTP端口
- `email_username`：邮箱账号
- `email_password`：邮箱密码（加密存储）
- `email_from_name`：发件人名称

**通知配置（notification）**：
- `notification_enabled`：是否启用通知
- `email_notification_enabled`：是否启用邮件通知

## 前端实现

### 11.1 系统配置页面
**路由**：`/system/config`

**页面结构**：
- 左侧：配置分类列表（Menu）
- 右侧：配置表单（Form）或配置列表（Table）

### 11.2 页面布局方案一：分类+表单
**左侧分类菜单**：
- 系统配置
- 上传配置
- 邮件配置
- 通知配置

**右侧配置表单**：
- 点击左侧分类，右侧显示该分类的配置表单
- 每个配置项对应一个表单字段
- 表单底部有"保存"按钮

**表单实现**：
1. 根据选中的分类，查询该分类的所有配置
2. 动态生成表单字段
3. 根据配置的 type 字段渲染不同的输入组件：
   - string：Input
   - number：InputNumber
   - boolean：Switch
   - json：TextArea（或 JSON 编辑器）
4. 保存时调用批量更新接口

### 11.3 页面布局方案二：表格管理
**页面结构**：
- 搜索区域（分类筛选、关键字搜索）
- 操作按钮区（新增配置）
- 数据表格
- 分页器

**数据表格列**：
- 序号
- 配置分类
- 配置键
- 配置值（长文本省略，详情查看）
- 数据类型（Tag）
- 是否公开（Tag）
- 描述
- 排序
- 操作（编辑、删除）

**新增/编辑配置**：
- 弹窗表单
- 字段：category、key、value、description、type、is_public、sort

### 11.4 推荐布局：分类+表单
- 更符合配置管理的使用场景
- 用户体验更好
- 可批量保存同一分类的配置

### 11.5 配置表单实现细节
**系统配置表单**：
- 网站名称（Input）
- 网站Logo（Upload，上传后显示预览）
- 网站描述（TextArea）
- 网站关键词（Input）
- 版权信息（Input）

**上传配置表单**：
- 最大上传大小（InputNumber，单位：MB，提交时转换为字节）
- 允许的文件类型（Select，多选，或 Tag 输入）
- 头像最大大小（InputNumber，单位：MB）

**邮件配置表单**：
- SMTP服务器（Input）
- SMTP端口（InputNumber）
- 邮箱账号（Input）
- 邮箱密码（Password）
- 发件人名称（Input）
- 测试邮件（Button，点击发送测试邮件到指定邮箱）

**通知配置表单**：
- 启用通知（Switch）
- 启用邮件通知（Switch）

### 11.6 配置保存
**保存流程**：
1. 表单验证
2. 收集当前分类的所有配置
3. 调用批量更新接口
4. 成功后提示并重新加载配置

### 11.7 配置测试功能（可选）
**邮件配置测试**：
- 在邮件配置表单底部添加"发送测试邮件"按钮
- 点击后输入测试邮箱地址
- 发送测试邮件验证配置是否正确

### 11.8 公开配置获取
**前端初始化时**：
1. 调用获取公开配置接口
2. 将配置存储到 store 或 localStorage
3. 在应用中使用配置（如：网站名称、Logo等）

**配置 Store**：
```typescript
// src/store/config.store.ts
interface ConfigState {
  publicConfigs: Record<string, any>;
  getConfig: (key: string, defaultValue?: any) => any;
  fetchPublicConfigs: () => Promise<void>;
}
```

**使用示例**：
```typescript
const siteName = configStore.getConfig('site_name', '默认名称');
const uploadMaxSize = configStore.getConfig('upload_max_size', 10485760);
```

### 11.9 API Service
创建 `src/services/config.service.ts`：
- `getConfigList(params)`：获取配置列表
- `getConfigDetail(id)`：获取配置详情
- `getConfigByKey(key)`：根据键获取配置
- `getPublicConfigs()`：获取公开配置
- `getConfigCategories()`：获取配置分类
- `createConfig(data)`：创建配置
- `updateConfig(id, data)`：更新配置
- `batchUpdateConfigs(configs)`：批量更新配置
- `deleteConfig(id)`：删除配置
- `testEmailConfig(data)`：测试邮件配置

### 11.10 组件拆分
建议拆分组件：
- `ConfigManagement.tsx`：主页面
- `ConfigCategoryMenu.tsx`：分类菜单
- `ConfigForm.tsx`：配置表单（通用）
- `SystemConfigForm.tsx`：系统配置表单
- `UploadConfigForm.tsx`：上传配置表单
- `EmailConfigForm.tsx`：邮件配置表单
- `NotificationConfigForm.tsx`：通知配置表单
- 或使用方案二的：`ConfigTable.tsx`、`ConfigFormModal.tsx`

## 测试点

### 后端测试
- [ ] 获取配置列表，分页正确
- [ ] 根据分类筛选配置正常
- [ ] 根据 key 获取配置成功
- [ ] 获取公开配置接口返回正确数据
- [ ] 创建配置成功
- [ ] 创建配置时 key 重复，返回错误
- [ ] 创建 JSON 类型配置，验证 JSON 格式
- [ ] 更新配置成功
- [ ] 批量更新配置成功
- [ ] 删除配置成功
- [ ] 配置缓存机制正常（如实现）
- [ ] 配置变更后缓存清除

### 前端测试
- [ ] 配置列表或表单正常显示
- [ ] 分类切换正常
- [ ] 配置表单根据数据类型正确渲染
- [ ] 保存配置成功
- [ ] 表单验证正常
- [ ] 公开配置在应用中可用
- [ ] 测试邮件功能正常（如实现）

## 验收标准

### 功能验收
- [ ] 配置的CRUD操作正常
- [ ] 配置分类清晰
- [ ] 公开配置可供前端使用
- [ ] 配置更新后立即生效

### 数据验收
- [ ] 默认配置已初始化
- [ ] 配置数据类型正确
- [ ] JSON 类型配置可正确解析
- [ ] 操作日志完整记录

### 用户体验
- [ ] 配置页面布局合理
- [ ] 表单使用便捷
- [ ] 配置说明清晰
- [ ] 保存成功有反馈

## 注意事项

1. **敏感配置**：
   - 邮箱密码等敏感配置需加密存储
   - 敏感配置不要设置为 is_public=true
   - 返回前端时考虑脱敏

2. **配置验证**：
   - 配置值的格式验证（如：邮箱格式、数字范围等）
   - JSON 类型配置的 JSON 格式验证
   - 提供配置测试功能（如：邮件配置测试）

3. **缓存策略**：
   - 高频读取的配置建议缓存
   - 配置更新后及时清除缓存
   - 考虑缓存一致性

4. **配置隔离**：
   - 管理员配置与用户配置隔离
   - 公开配置与私有配置隔离

5. **配置备份**：
   - 重要配置变更前考虑备份
   - 提供配置导入导出功能（可选）

6. **配置生效**：
   - 明确哪些配置需要重启服务生效
   - 哪些配置可以热更新
   - 给用户清晰的提示

## 下一步预告
Step 11 将实现文件上传管理模块（头像上传、附件管理、文件预览）
