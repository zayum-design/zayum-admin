# Zayum CLI

Zayum Admin CLI - 插件管理工具

## 安装

```bash
cd cli
npm install
npm run build
npm link
```

## 使用方法

### 插件管理

#### 搜索插件

```bash
# 从默认市场搜索插件
zayum plugin:search schedule

# 从指定市场搜索
zayum plugin:search cron --source official
```

#### 安装插件

```bash
# 从市场安装（最新版本）
zayum plugin:install schedule
zayum plugin:install schedule --enable

# 安装指定版本
zayum plugin:install schedule --version 1.2.0

# 从指定源安装
zayum plugin:install schedule --source official

# 从 URL 安装
zayum plugin:install https://example.com/schedule@1.0.0.zip --url

# 从本地路径安装
zayum plugin:install ./plugins/schedule --local
zayum plugin:install ./plugins/schedule --enable
```

#### 更新插件

```bash
# 更新到最新版本
zayum plugin:update schedule

# 更新到指定版本
zayum plugin:update schedule --version 1.2.0
```

#### 插件列表与状态

```bash
# 列出所有已安装插件
zayum plugin:list
zayum plugin:list --installed
zayum plugin:list --enabled
```

#### 启用/禁用插件

```bash
zayum plugin:enable schedule
zayum plugin:disable schedule
```

#### 卸载插件

```bash
zayum plugin:uninstall schedule
```

### 插件源管理

#### 查看插件源

```bash
zayum source:list
```

#### 添加插件源

```bash
# 添加公开源
zayum source:add official https://market.zayum.com

# 添加需要认证的私有源
zayum source:add mycompany https://plugins.mycompany.com --token xxx
```

#### 设置默认源

```bash
zayum source:default official
```

#### 启用/禁用插件源

```bash
zayum source:enable mycompany
zayum source:disable mycompany
```

#### 删除插件源

```bash
zayum source:remove mycompany
```

### 全局选项

```bash
# 指定后端 API 地址
zayum plugin:list --api-url http://localhost:3000

# 指定认证 Token
zayum plugin:install schedule --token xxx
```

## 配置

CLI 配置文件位于 `~/.zayum/config.json`：

```json
{
  "defaultSource": "official",
  "sources": {
    "official": {
      "name": "official",
      "url": "https://market.zayum.com",
      "enabled": true,
      "isDefault": true
    },
    "mycompany": {
      "name": "mycompany",
      "url": "https://plugins.mycompany.com",
      "token": "xxx",
      "enabled": true
    }
  }
}
```

## 环境变量

```bash
# 后端 API 地址
export ZAYUM_API_URL=http://localhost:3000

# API 认证 Token
export ZAYUM_API_TOKEN=your-token
```

## 命令速查表

| 命令 | 说明 |
|------|------|
| `zayum plugin:list` | 列出已安装插件 |
| `zayum plugin:search <keyword>` | 搜索插件 |
| `zayum plugin:install <name>` | 从市场安装插件 |
| `zayum plugin:install <path> --local` | 从本地安装插件 |
| `zayum plugin:install <url> --url` | 从 URL 安装插件 |
| `zayum plugin:update <name>` | 更新插件 |
| `zayum plugin:enable <name>` | 启用插件 |
| `zayum plugin:disable <name>` | 禁用插件 |
| `zayum plugin:uninstall <name>` | 卸载插件 |
| `zayum source:list` | 列出插件源 |
| `zayum source:add <name> <url>` | 添加插件源 |
| `zayum source:remove <name>` | 删除插件源 |
| `zayum source:default <name>` | 设置默认源 |
| `zayum source:enable <name>` | 启用插件源 |
| `zayum source:disable <name>` | 禁用插件源 |

## 开发

```bash
# 开发模式
npm run watch

# 构建
npm run build
```
