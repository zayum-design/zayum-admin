# Zayum CLI - AI 代码生成器

基于 AI 的智能代码生成工具，支持对话式开发流程。

## 安装

```bash
# 在项目根目录执行
cd cli && npm install && npm run build
```

## 使用方法

### 1. 启动 AI 交互模式

```bash
./zayum ai
```

启动后会自动分析项目结构，然后进入交互式对话模式。

### 2. 常用命令

在交互模式下，可以使用以下命令：

| 命令 | 说明 |
|------|------|
| `/new` | 创建新会话 |
| `/model` | 切换 AI 模型 |
| `/provider` | 切换 AI 提供商 |
| `/sessions` | 列出所有会话 |
| `/switch <id>` | 切换到指定会话 |
| `/preview` | 预览生成的代码 |
| `/save` | 保存代码到项目 |
| `/status` | 显示当前状态 |
| `/exit` | 退出 |

### 3. 工作流程

1. **描述需求**：告诉 AI 你想开发什么功能
2. **设计表结构**：AI 会引导你设计数据库表结构
3. **确认功能**：确认需要的 CRUD 功能
4. **生成代码**：AI 生成完整的后端代码
5. **预览代码**：使用 `/preview` 查看生成的文件
6. **保存代码**：使用 `/save` 将代码写入项目
7. **自动注册**：代码会自动注册到 app.module.ts
8. **菜单配置**：显示菜单配置，可手动添加到数据库

### 4. 配置

设置后端 API 地址：

```bash
# 设置环境变量
export ZAYUM_API_URL=http://localhost:3000
export ZAYUM_API_KEY=your-jwt-token

# 或使用 config 命令
./zayum config --set apiUrl=http://localhost:3000
```

## 示例对话

```
> 我想开发一个订单管理系统

AI: 好的，让我来帮你设计订单管理系统。首先，我们需要设计数据表结构。

订单表建议包含以下字段：
- id: 主键
- orderNo: 订单编号
- customerName: 客户名称
- amount: 订单金额
- status: 订单状态
- createdAt: 创建时间
- updatedAt: 更新时间

还有其他需要的字段吗？比如商品信息、收货地址等？

> 需要添加商品列表和收货地址

AI: 好的，那我们需要两个表：
1. 订单主表 (orders)
2. 订单商品表 (order_items)

是否需要支持以下功能？
- [x] 列表查询（分页、搜索）
- [x] 创建订单
- [x] 编辑订单
- [x] 删除订单
- [ ] 导出 Excel
- [ ] 订单状态流转

> 先实现基础的 CRUD

AI: [生成代码中...]

已生成以下文件：
- src/entities/sys-order.entity.ts
- src/modules/order/order.module.ts
- src/modules/order/order.service.ts
- src/modules/order/order.controller.ts
- src/modules/order/dto/*.dto.ts

💡 提示: 使用 /preview 预览代码，/save 保存代码到项目

> /save

确认保存? (y/n): y
✓ 已保存 7 个文件
✓ 已更新 app.module.ts

菜单配置（请手动添加到数据库）：
{
  "name": "order:manage",
  "path": "/order",
  "meta": { "title": "订单管理" }
}
```

## 支持的 AI 提供商

- DeepSeek (默认)
- OpenAI
- 通义千问 (Qwen)
- Moonshot (Kimi)

## 项目结构要求

CLI 会自动检测以下项目结构：

```
project/
├── backend/          # NestJS 后端
│   └── src/
│       ├── entities/    # 实体目录
│       └── modules/     # 模块目录
└── frontend/         # Vue/React 前端
    └── src/
        ├── api/          # API 目录
        ├── components/   # 组件目录
        └── pages/        # 页面目录
```

## 许可证

MIT
