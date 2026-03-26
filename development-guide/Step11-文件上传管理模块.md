# Step 11 - 文件上传管理模块

## 目标
实现文件上传功能，包括头像上传、附件上传、文件预览、文件管理等

## 后端实现

### 11.1 上传模块搭建
- 创建 `upload` 模块（controller、service、module）
- 配置 multer 中间件
- 创建上传相关 DTO

### 11.2 Multer 配置
**存储配置**：
- 存储方式：磁盘存储（diskStorage）
- 存储路径：`/uploads` 目录
- 文件命名：时间戳 + 随机字符串 + 原始扩展名

**文件过滤**：
- 根据文件类型（mimetype）过滤
- 头像：仅允许图片（image/jpeg、image/png、image/gif）
- 附件：根据配置允许的文件类型

**大小限制**：
- 从系统配置读取上传大小限制
- 头像：限制 2MB
- 附件：限制 10MB（可配置）

### 11.3 DTO 定义

#### UploadDto（上传参数）
**字段**：
- `category`：文件分类（avatar/attachment/image/document）
- 文件通过 multipart/form-data 上传

#### QueryUploadDto（查询参数）
**字段**：
- `page`：页码，默认1
- `pageSize`：每页数量，默认10
- `user_type`：上传者类型筛选（admin/user）
- `user_id`：上传者ID筛选
- `category`：文件分类筛选
- `extension`：文件扩展名筛选
- `filename`：文件名（模糊搜索）
- `created_at_start`：上传时间开始
- `created_at_end`：上传时间结束

### 11.4 文件上传接口
**接口**：`POST /api/upload`

**权限**：已登录即可（根据业务调整）

**请求方式**：multipart/form-data

**请求参数**：
- `file`：文件（必填）
- `category`：文件分类（可选，默认 attachment）

**业务逻辑**：
1. 验证用户登录状态
2. 从 token 获取用户信息
3. 验证文件大小（根据 category）
4. 验证文件类型（根据 category 和系统配置）
5. 生成唯一文件名
6. 保存文件到磁盘（/uploads 目录）
7. 生成访问URL
8. 保存上传记录到数据库（sys_upload 表）
9. 返回文件信息

**响应格式**：
```
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "id": 1,
    "filename": "avatar.jpg",
    "filepath": "/uploads/2024/01/01/abc123.jpg",
    "url": "http://localhost:3000/uploads/2024/01/01/abc123.jpg",
    "filesize": 102400,
    "mimetype": "image/jpeg",
    "extension": "jpg",
    "category": "avatar"
  }
}
```

**错误处理**：
- 文件为空：400
- 文件过大：413
- 文件类型不允许：400
- 磁盘空间不足：500

### 11.5 批量上传接口
**接口**：`POST /api/upload/batch`

**请求参数**：
- `files`：文件数组

**业务逻辑**：
- 循环处理每个文件
- 返回上传结果列表（成功、失败）

### 11.6 文件列表接口
**接口**：`GET /api/uploads`

**权限**：`file:list:view`

**查询参数**：参考 QueryUploadDto

**业务逻辑**：
1. 构建查询条件
2. 分页查询
3. 按上传时间倒序排序
4. 返回文件列表

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
        "category": "avatar",
        "filename": "avatar.jpg",
        "filepath": "/uploads/2024/01/01/abc123.jpg",
        "url": "http://localhost:3000/uploads/2024/01/01/abc123.jpg",
        "filesize": 102400,
        "mimetype": "image/jpeg",
        "extension": "jpg",
        "created_at": "2024-01-01 12:00:00"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### 11.7 文件详情接口
**接口**：`GET /api/uploads/:id`

**权限**：`file:list:view`

**业务逻辑**：
1. 根据 ID 查询文件信息
2. 文件不存在时返回 404

### 11.8 删除文件接口
**接口**：`DELETE /api/uploads/:id`

**权限**：`file:list:delete` 或文件上传者本人

**业务逻辑**：
1. 检查文件是否存在
2. 验证权限（管理员或文件上传者）
3. 删除磁盘文件
4. 删除数据库记录
5. 记录操作日志
6. 返回成功消息

### 11.9 批量删除文件接口
**接口**：`DELETE /api/uploads/batch`

**权限**：`file:list:delete`

**请求参数**：
- `ids`：文件ID数组

**业务逻辑**：
- 批量删除文件和记录

### 11.10 静态文件服务
**配置静态文件访问**：
- 在 `main.ts` 中配置静态文件服务
- 路径：`/uploads` → 映射到磁盘 `/uploads` 目录
- 允许跨域访问（CORS）

**示例配置**：
```typescript
app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  prefix: '/uploads/',
});
```

### 11.11 文件下载接口（可选）
**接口**：`GET /api/uploads/:id/download`

**业务逻辑**：
1. 查询文件信息
2. 设置响应头（Content-Disposition: attachment）
3. 返回文件流

### 11.12 图片缩略图生成（可选）
**功能**：
- 上传图片时自动生成缩略图
- 使用 sharp 库处理图片
- 缩略图尺寸：200x200、400x400 等
- 保存到 `/uploads/thumbs` 目录

**缩略图URL**：
- 原图：`/uploads/2024/01/01/abc123.jpg`
- 缩略图：`/uploads/thumbs/200x200/2024/01/01/abc123.jpg`

### 11.13 文件存储优化（可选）
**按日期分目录存储**：
- 路径格式：`/uploads/YYYY/MM/DD/filename.ext`
- 避免单目录文件过多

**对象存储支持**（高级功能）：
- 支持上传到云存储（阿里云OSS、腾讯云COS、AWS S3等）
- 配置切换：本地存储 vs 云存储
- 使用统一的存储接口

### 11.14 文件安全
**文件类型验证**：
- 不仅检查扩展名，还检查文件魔数（magic number）
- 防止恶意文件伪装

**路径遍历防护**：
- 验证文件名，防止 `../` 等路径遍历攻击

**访问控制**：
- 私有文件需要权限验证
- 公开文件直接访问

## 前端实现

### 12.1 通用上传组件
创建 `src/components/FileUpload.tsx`：

**Props**：
- `category`：文件分类
- `accept`：接受的文件类型（如：image/*）
- `maxSize`：最大文件大小（MB）
- `maxCount`：最多上传数量
- `value`：已上传的文件列表
- `onChange`：上传成功后的回调
- `onRemove`：删除文件的回调

**功能**：
- 使用 Antd Upload 组件
- 支持拖拽上传
- 显示上传进度
- 文件列表展示
- 文件预览（图片）
- 文件删除

**使用示例**：
```tsx
<FileUpload
  category="avatar"
  accept="image/*"
  maxSize={2}
  maxCount={1}
  value={avatarUrl}
  onChange={(url) => setAvatarUrl(url)}
/>
```

### 12.2 头像上传组件
创建 `src/components/AvatarUpload.tsx`：

**特点**：
- 圆形预览
- 只能上传一张
- 支持裁剪（可选，使用 react-image-crop）
- 上传前预览

**实现**：
- 基于 FileUpload 组件封装
- 或直接使用 Antd Upload 的 avatar 模式

### 12.3 图片上传组件
创建 `src/components/ImageUpload.tsx`：

**特点**：
- 支持多张上传
- 图片预览（点击放大）
- 拖拽排序（可选）
- 上传进度展示

### 12.4 文件管理页面
**路由**：`/file/list`

**页面结构**：
- 搜索区域
- 操作按钮区（批量删除）
- 文件网格或列表
- 分页器

### 12.5 文件展示方式
**网格视图（推荐）**：
- 使用 Card 或 Grid 展示文件
- 图片显示缩略图
- 其他文件显示文件图标
- 悬停显示文件信息（文件名、大小、上传时间）
- 点击可预览或下载

**列表视图**：
- 使用 Table 展示
- 列：文件名、类型、大小、上传者、上传时间、操作

### 12.6 文件搜索功能
**搜索条件**：
- 文件名（输入框）
- 文件分类（下拉选择）
- 文件类型（下拉选择）
- 上传者（下拉选择，仅管理员）
- 上传时间（日期范围选择器）

### 12.7 文件预览
**图片预览**：
- 点击图片弹出预览（Antd Image.PreviewGroup）
- 支持缩放、旋转、下载

**PDF预览**：
- 使用 react-pdf 或嵌入 iframe
- 或直接下载

**其他文件**：
- 提供下载链接

### 12.8 文件上传
**触发**：点击"上传文件"按钮

**实现方式**：对话框

**内容**：
- 文件分类选择
- 拖拽上传区域
- 文件列表（显示上传进度）
- 上传按钮

### 12.9 文件删除
**触发**：点击文件的"删除"按钮

**实现方式**：确认对话框

**确认提示**：
```
确定要删除文件 "xxx" 吗？删除后将无法恢复。
```

### 12.10 批量操作
**批量选择**：
- 复选框选择文件
- 全选/反选

**批量删除**：
- 选中多个文件后点击"批量删除"
- 确认对话框提示

### 12.11 文件统计（可选）
**统计信息**：
- 文件总数
- 总大小
- 按分类统计
- 按类型统计

**展示方式**：
- 卡片展示
- 图表展示（饼图、柱状图）

### 12.12 API Service
创建 `src/services/upload.service.ts`：
- `uploadFile(file, category)`：上传文件
- `uploadFiles(files, category)`：批量上传
- `getUploadList(params)`：获取文件列表
- `getUploadDetail(id)`：获取文件详情
- `deleteUpload(id)`：删除文件
- `batchDeleteUploads(ids)`：批量删除

**上传进度监听**：
```typescript
uploadFile(file: File, category: string, onProgress?: (progress: number) => void) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  
  return axios.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress?.(percentCompleted);
    }
  });
}
```

### 12.13 组件拆分
建议拆分组件：
- `FileUpload.tsx`：通用上传组件
- `AvatarUpload.tsx`：头像上传组件
- `ImageUpload.tsx`：图片上传组件
- `FileList.tsx`：文件列表页面
- `FileGrid.tsx`：文件网格视图
- `FileTable.tsx`：文件列表视图
- `FilePreview.tsx`：文件预览组件
- `UploadModal.tsx`：上传对话框

## 测试点

### 后端测试
- [ ] 上传图片成功
- [ ] 上传文件成功
- [ ] 文件大小超限，返回错误
- [ ] 文件类型不允许，返回错误
- [ ] 批量上传成功
- [ ] 获取文件列表，分页正确
- [ ] 搜索功能正常
- [ ] 删除文件成功，磁盘文件也被删除
- [ ] 批量删除成功
- [ ] 静态文件可正常访问
- [ ] 上传记录正确保存

### 前端测试
- [ ] 上传组件正常显示
- [ ] 拖拽上传正常
- [ ] 上传进度正确显示
- [ ] 上传成功后返回文件URL
- [ ] 文件预览正常（图片）
- [ ] 文件列表正常显示
- [ ] 搜索功能正常
- [ ] 删除文件成功
- [ ] 批量删除成功
- [ ] 头像上传组件正常工作
- [ ] 表单中的文件上传集成正常

## 验收标准

### 功能验收
- [ ] 文件上传功能完整
- [ ] 支持多种文件类型
- [ ] 文件大小和类型验证正常
- [ ] 文件预览功能正常
- [ ] 文件管理功能完善

### 数据验收
- [ ] 上传记录正确保存
- [ ] 文件正确存储到磁盘
- [ ] 文件URL可访问
- [ ] 删除文件时磁盘文件也删除

### 用户体验
- [ ] 上传界面友好
- [ ] 上传进度清晰
- [ ] 文件预览流畅
- [ ] 文件管理便捷

## 注意事项

1. **文件安全**：
   - 严格验证文件类型
   - 防止上传恶意文件
   - 防止路径遍历攻击
   - 限制文件大小

2. **存储管理**：
   - 定期清理无用文件
   - 监控磁盘空间
   - 考虑文件备份策略

3. **性能优化**：
   - 大文件上传使用分片上传（可选）
   - 图片自动生成缩略图
   - 静态资源使用CDN（生产环境）

4. **用户权限**：
   - 用户只能删除自己上传的文件
   - 管理员可以管理所有文件

5. **文件命名**：
   - 使用唯一文件名（时间戳+随机字符串）
   - 避免文件名冲突
   - 保留原始文件名供下载使用

6. **跨域问题**：
   - 确保静态文件服务支持CORS
   - 前端访问文件时不会跨域报错

## 下一步预告
Step 12 将实现消息通知模块（站内信、邮件通知功能）
