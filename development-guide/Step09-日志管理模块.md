# Step 09 - 日志管理模块

## 目标
实现操作日志和登录日志的查询、展示和分析功能，提供系统审计能力

## 后端实现

### 9.1 日志模块搭建
- 创建 `log` 模块（controller、service、module）
- 创建日志相关 DTO（QueryOperationLogDto、QueryLoginLogDto）

### 9.2 操作日志 DTO

#### QueryOperationLogDto（查询参数）
**字段**：
- `page`：页码，默认1
- `pageSize`：每页数量，默认10
- `user_type`：用户类型筛选（admin/user）
- `user_id`：用户ID筛选
- `username`：用户名（模糊搜索）
- `module`：模块名称筛选
- `action`：操作动作筛选
- `method`：请求方法筛选（GET/POST/PUT/DELETE）
- `status`：操作状态筛选（success/failure）
- `ip`：IP地址（模糊搜索）
- `created_at_start`：开始时间
- `created_at_end`：结束时间

### 9.3 操作日志列表接口
**接口**：`GET /api/logs/operations`

**权限**：`log:operation:view`

**查询参数**：参考 QueryOperationLogDto

**业务逻辑**：
1. 构建查询条件（支持多条件组合）
2. 分页查询
3. 按创建时间倒序排序
4. 返回列表数据和分页信息

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
        "username": "admin",
        "module": "管理员管理",
        "action": "创建管理员",
        "method": "POST",
        "url": "/api/admins",
        "params": "{\"username\":\"test\",\"nickname\":\"测试\"}",
        "ip": "127.0.0.1",
        "user_agent": "Mozilla/5.0...",
        "status": "success",
        "error_msg": null,
        "duration": 125,
        "created_at": "2024-01-01 12:00:00"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1000,
      "totalPages": 100
    }
  }
}
```

### 9.4 操作日志详情接口
**接口**：`GET /api/logs/operations/:id`

**权限**：`log:operation:view`

**业务逻辑**：
1. 根据 ID 查询日志详情
2. 格式化参数（JSON 美化显示）
3. 返回详细信息

### 9.5 操作日志统计接口
**接口**：`GET /api/logs/operations/statistics`

**权限**：`log:operation:view`

**查询参数**：
- `start_date`：开始日期
- `end_date`：结束日期
- `dimension`：统计维度（by_date/by_module/by_user/by_status）

**业务逻辑**：
1. 根据时间范围和维度统计数据
2. 返回统计结果

**响应格式（按日期统计）**：
```
{
  "code": 200,
  "data": {
    "by_date": [
      { "date": "2024-01-01", "count": 150 },
      { "date": "2024-01-02", "count": 200 }
    ]
  }
}
```

### 9.6 批量删除操作日志接口（可选）
**接口**：`DELETE /api/logs/operations/batch`

**权限**：`log:operation:delete`

**请求参数**：
- `ids`：日志ID数组
- 或 `before_date`：删除指定日期之前的所有日志

**业务逻辑**：
1. 验证参数
2. 批量删除日志
3. 返回删除数量

**安全考虑**：
- 删除日志是敏感操作，需要严格权限控制
- 建议仅允许删除旧日志（如3个月前的）
- 记录删除操作本身

### 9.7 登录日志 DTO

#### QueryLoginLogDto（查询参数）
**字段**：
- `page`：页码，默认1
- `pageSize`：每页数量，默认10
- `user_type`：用户类型筛选（admin/user）
- `user_id`：用户ID筛选
- `username`：用户名（模糊搜索）
- `ip`：IP地址（模糊搜索）
- `location`：登录地点（模糊搜索）
- `status`：登录状态筛选（success/failure）
- `created_at_start`：开始时间
- `created_at_end`：结束时间

### 9.8 登录日志列表接口
**接口**：`GET /api/logs/logins`

**权限**：`log:login:view`

**查询参数**：参考 QueryLoginLogDto

**业务逻辑**：
1. 构建查询条件
2. 分页查询
3. 按创建时间倒序排序
4. 返回列表数据和分页信息

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
        "username": "admin",
        "ip": "127.0.0.1",
        "location": "中国-广东-深圳",
        "browser": "Chrome 120",
        "os": "Windows 11",
        "status": "success",
        "message": "登录成功",
        "created_at": "2024-01-01 09:00:00"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 500,
      "totalPages": 50
    }
  }
}
```

### 9.9 登录日志详情接口
**接口**：`GET /api/logs/logins/:id`

**权限**：`log:login:view`

**业务逻辑**：
1. 根据 ID 查询日志详情
2. 返回详细信息

### 9.10 登录日志统计接口
**接口**：`GET /api/logs/logins/statistics`

**权限**：`log:login:view`

**查询参数**：
- `start_date`：开始日期
- `end_date`：结束日期
- `dimension`：统计维度（by_date/by_status/by_location）

**业务逻辑**：
1. 根据时间范围和维度统计数据
2. 返回统计结果

**响应格式（按状态统计）**：
```
{
  "code": 200,
  "data": {
    "by_status": [
      { "status": "success", "count": 450 },
      { "status": "failure", "count": 50 }
    ]
  }
}
```

### 9.11 日志记录增强
**在之前步骤中完善日志记录**：

#### 操作日志记录时机
- 所有写操作（POST、PUT、PATCH、DELETE）
- 敏感读操作（查看敏感信息）
- 批量操作
- 权限变更
- 配置修改

#### 操作日志记录内容
- 操作人信息（user_type、user_id、username）
- 操作详情（module、action）
- 请求信息（method、url、params）
- 环境信息（ip、user_agent）
- 执行结果（status、error_msg、duration）
- 时间戳（created_at）

#### 登录日志记录时机
- 登录成功
- 登录失败（密码错误、账号不存在、账号被锁定等）
- 登出（可选）

#### 登录日志记录内容
- 用户信息（user_type、user_id、username）
- 环境信息（ip、location、browser、os）
- 登录结果（status、message）
- 时间戳（created_at）

### 9.12 日志拦截器实现
创建全局日志拦截器（Interceptor）：
- 自动记录所有接口的操作日志
- 捕获请求开始和结束时间，计算 duration
- 捕获异常信息，记录 error_msg
- 解析 User-Agent 获取浏览器和操作系统信息
- 根据 IP 查询地理位置（可选，使用第三方IP库）

**装饰器方式（可选）**：
- 创建 `@OperationLog()` 装饰器
- 在需要记录日志的接口上添加装饰器
- 装饰器参数：module、action

### 9.13 日志导出接口（可选）
**接口**：`GET /api/logs/operations/export` 或 `GET /api/logs/logins/export`

**权限**：`log:operation:export` 或 `log:login:export`

**业务逻辑**：
1. 根据查询条件获取日志数据
2. 生成 Excel 文件
3. 返回文件下载链接或文件流

## 前端实现

### 10.1 操作日志页面
**路由**：`/log/operation`

**页面结构**：
- 搜索区域
- 操作按钮区（导出、删除）
- 数据表格
- 分页器

### 10.2 操作日志搜索功能
**搜索条件**：
- 用户类型（下拉选择：管理员/用户）
- 用户名（输入框）
- 模块名称（下拉选择或输入框）
- 操作动作（下拉选择或输入框）
- 请求方法（下拉选择：GET/POST/PUT/DELETE）
- 操作状态（下拉选择：成功/失败）
- IP地址（输入框）
- 时间范围（日期范围选择器）

**功能**：
- 搜索、重置按钮
- 高级搜索展开/折叠

### 10.3 操作日志数据表格
**表格列**：
- 序号
- 用户类型（Tag：admin=蓝色、user=绿色）
- 用户名
- 模块名称
- 操作动作
- 请求方法（Tag：GET=绿、POST=蓝、PUT=橙、DELETE=红）
- 请求URL（可省略，详情查看）
- IP地址
- 操作状态（Tag：success=绿色、failure=红色）
- 执行时长（单位：ms）
- 操作时间
- 操作（查看详情）

**表格功能**：
- 点击行展开，显示请求参数和错误信息（可选）
- 排序
- 固定操作列

### 10.4 操作日志详情
**触发**：点击"查看详情"按钮

**实现方式**：抽屉或对话框

**显示内容**：
- 操作人信息
- 操作详情（模块、动作）
- 请求信息（方法、URL、参数，JSON 格式美化显示）
- 环境信息（IP、User-Agent）
- 执行结果（状态、错误信息、执行时长）
- 操作时间

### 10.5 操作日志统计图表
**位置**：页面顶部或单独的统计页面

**图表类型**：
- 折线图：按日期统计操作次数（ECharts 或 Recharts）
- 饼图：按模块统计操作次数
- 柱状图：按操作动作统计次数
- 饼图：操作成功/失败比例

**交互**：
- 点击图表可筛选列表
- 支持时间范围切换（今天、最近7天、最近30天、自定义）

### 10.6 登录日志页面
**路由**：`/log/login`

**页面结构**：
- 搜索区域
- 操作按钮区（导出）
- 数据表格
- 分页器

### 10.7 登录日志搜索功能
**搜索条件**：
- 用户类型（下拉选择：管理员/用户）
- 用户名（输入框）
- IP地址（输入框）
- 登录地点（输入框）
- 登录状态（下拉选择：成功/失败）
- 时间范围（日期范围选择器）

### 10.8 登录日志数据表格
**表格列**：
- 序号
- 用户类型（Tag）
- 用户名
- IP地址
- 登录地点
- 浏览器
- 操作系统
- 登录状态（Tag：success=绿色、failure=红色）
- 登录消息
- 登录时间
- 操作（查看详情）

### 10.9 登录日志详情
**触发**：点击"查看详情"按钮

**实现方式**：抽屉或对话框

**显示内容**：
- 用户信息
- 环境信息（IP、地点、浏览器、操作系统）
- 登录结果（状态、消息）
- 登录时间

### 10.10 登录日志统计图表
**图表类型**：
- 折线图：按日期统计登录次数
- 饼图：登录成功/失败比例
- 柱状图：按地点统计登录次数（Top 10）

### 10.11 导出功能
**触发**：点击"导出"按钮

**实现方式**：
1. 根据当前搜索条件导出
2. 调用导出接口
3. 下载生成的 Excel 文件

### 10.12 API Service
创建 `src/services/log.service.ts`：
- `getOperationLogList(params)`：获取操作日志列表
- `getOperationLogDetail(id)`：获取操作日志详情
- `getOperationLogStatistics(params)`：获取操作日志统计
- `exportOperationLogs(params)`：导出操作日志
- `deleteOperationLogs(ids)`：删除操作日志
- `getLoginLogList(params)`：获取登录日志列表
- `getLoginLogDetail(id)`：获取登录日志详情
- `getLoginLogStatistics(params)`：获取登录日志统计
- `exportLoginLogs(params)`：导出登录日志

### 10.13 组件拆分
建议拆分组件：
- `OperationLogList.tsx`：操作日志主页面
- `OperationLogSearchForm.tsx`：操作日志搜索表单
- `OperationLogTable.tsx`：操作日志数据表格
- `OperationLogDetail.tsx`：操作日志详情抽屉
- `OperationLogCharts.tsx`：操作日志统计图表
- `LoginLogList.tsx`：登录日志主页面
- `LoginLogSearchForm.tsx`：登录日志搜索表单
- `LoginLogTable.tsx`：登录日志数据表格
- `LoginLogDetail.tsx`：登录日志详情抽屉
- `LoginLogCharts.tsx`：登录日志统计图表

## 测试点

### 后端测试
- [ ] 获取操作日志列表，分页正确
- [ ] 操作日志搜索功能正常（各种条件组合）
- [ ] 获取操作日志详情成功
- [ ] 操作日志统计接口返回正确数据
- [ ] 获取登录日志列表，分页正确
- [ ] 登录日志搜索功能正常
- [ ] 获取登录日志详情成功
- [ ] 登录日志统计接口返回正确数据
- [ ] 日志拦截器正常工作，自动记录日志
- [ ] 导出功能正常（如实现）
- [ ] 删除日志功能正常（如实现）

### 前端测试
- [ ] 操作日志列表正常显示
- [ ] 操作日志搜索功能正常
- [ ] 操作日志详情正常显示
- [ ] 操作日志统计图表正常显示
- [ ] 登录日志列表正常显示
- [ ] 登录日志搜索功能正常
- [ ] 登录日志详情正常显示
- [ ] 登录日志统计图表正常显示
- [ ] 导出功能正常
- [ ] 时间范围选择正常

## 验收标准

### 功能验收
- [ ] 操作日志和登录日志完整记录
- [ ] 日志查询功能完善
- [ ] 日志统计图表直观
- [ ] 日志详情展示清晰
- [ ] 导出功能正常（如实现）

### 数据验收
- [ ] 所有操作都有日志记录
- [ ] 日志信息完整准确
- [ ] 日志时间准确
- [ ] IP和地理位置信息正确

### 用户体验
- [ ] 界面美观，信息展示清晰
- [ ] 搜索功能便捷
- [ ] 图表直观易懂
- [ ] 大数据量时性能良好

## 注意事项

1. **性能优化**：
   - 日志表数据量可能很大，注意查询性能
   - 使用索引优化查询（user_type、user_id、created_at、status）
   - 考虑日志归档策略（定期清理或转移旧日志）

2. **敏感信息处理**：
   - 不要记录密码等敏感信息
   - 请求参数中的敏感字段需要脱敏
   - 日志访问权限严格控制

3. **日志存储**：
   - 考虑日志存储成本
   - 可选方案：定期归档到文件或对象存储
   - 实时日志可存数据库，历史日志可存文件

4. **日志分析**：
   - 提供有价值的统计和分析
   - 帮助发现异常操作和安全问题
   - 支持审计和合规要求

5. **User-Agent 解析**：
   - 使用成熟的库解析（如 ua-parser-js）
   - 提取浏览器、操作系统等信息

6. **IP 地理位置**：
   - 可使用免费IP库（如 ip2region）
   - 或第三方API（有调用限制）

## 下一步预告
Step 10 将实现系统配置管理模块（配置项的CRUD及前端读取）
