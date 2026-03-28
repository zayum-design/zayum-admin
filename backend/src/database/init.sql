-- 初始化数据库表结构
-- 管理员组表
CREATE TABLE "sys_admin_group" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL UNIQUE,
    "description" VARCHAR(200),
    "permissions" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_admin_group" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sys_admin_group_status" ON "sys_admin_group" ("status");

-- 管理员表
CREATE TABLE "sys_admin" (
    "id" BIGSERIAL NOT NULL,
    "group_id" BIGINT NOT NULL DEFAULT 1,
    "username" VARCHAR(20) NOT NULL UNIQUE,
    "nickname" VARCHAR(50) NOT NULL,
    "password" VARCHAR(128) NOT NULL,
    "avatar" VARCHAR(255),
    "email" VARCHAR(100) UNIQUE,
    "mobile" VARCHAR(11) UNIQUE,
    "login_failure" INT NOT NULL DEFAULT 0,
    "login_at" TIMESTAMP,
    "login_ip" VARCHAR(50),
    "token" VARCHAR(512),
    "status" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_admin" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sys_admin_username" ON "sys_admin" ("username");
CREATE INDEX "idx_sys_admin_email" ON "sys_admin" ("email");
CREATE INDEX "idx_sys_admin_mobile" ON "sys_admin" ("mobile");
CREATE INDEX "idx_sys_admin_group_id" ON "sys_admin" ("group_id");
CREATE INDEX "idx_sys_admin_status" ON "sys_admin" ("status");

-- 用户组表
CREATE TABLE "sys_user_group" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL UNIQUE,
    "description" VARCHAR(200),
    "permissions" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_user_group" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sys_user_group_status" ON "sys_user_group" ("status");

-- 用户表
CREATE TABLE "sys_user" (
    "id" BIGSERIAL NOT NULL,
    "group_id" BIGINT NOT NULL DEFAULT 1,
    "username" VARCHAR(20) NOT NULL UNIQUE,
    "nickname" VARCHAR(50) NOT NULL,
    "password" VARCHAR(128) NOT NULL,
    "avatar" VARCHAR(255),
    "email" VARCHAR(100) UNIQUE,
    "mobile" VARCHAR(11) UNIQUE,
    "gender" VARCHAR(20) DEFAULT 'unknown',
    "birthday" DATE,
    "score" INT NOT NULL DEFAULT 0,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_user" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sys_user_username" ON "sys_user" ("username");
CREATE INDEX "idx_sys_user_email" ON "sys_user" ("email");
CREATE INDEX "idx_sys_user_mobile" ON "sys_user" ("mobile");
CREATE INDEX "idx_sys_user_group_id" ON "sys_user" ("group_id");
CREATE INDEX "idx_sys_user_status" ON "sys_user" ("status");

-- 权限表（后台管理）
CREATE TABLE "sys_admin_permission" (
    "id" BIGSERIAL NOT NULL,
    "parent_id" BIGINT NOT NULL DEFAULT 0,
    "name" VARCHAR(50) NOT NULL,
    "code" VARCHAR(100) NOT NULL UNIQUE,
    "type" VARCHAR(20) DEFAULT 'menu',
    "path" VARCHAR(200),
    "icon" VARCHAR(50),
    "component" VARCHAR(200),
    "sort" INT DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_admin_permission" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sys_admin_permission_code" ON "sys_admin_permission" ("code");
CREATE INDEX "idx_sys_admin_permission_parent_id" ON "sys_admin_permission" ("parent_id");
CREATE INDEX "idx_sys_admin_permission_status" ON "sys_admin_permission" ("status");

-- 角色权限关联表（后台管理）
CREATE TABLE "sys_admin_role_permission" (
    "id" BIGSERIAL NOT NULL,
    "role_type" VARCHAR(20) NOT NULL,
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_admin_role_permission" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_sys_admin_role_permission" UNIQUE ("role_type", "role_id", "permission_id")
);
CREATE INDEX "idx_sys_admin_role_permission_role_type" ON "sys_admin_role_permission" ("role_type");
CREATE INDEX "idx_sys_admin_role_permission_role_id" ON "sys_admin_role_permission" ("role_id");
CREATE INDEX "idx_sys_admin_role_permission_permission_id" ON "sys_admin_role_permission" ("permission_id");

-- ==================== 用户权限表（app/web 会员中心） ====================
-- 用途：管理 app/web 会员中心的菜单和按钮权限
CREATE TABLE "sys_user_permission" (
    "id" BIGSERIAL NOT NULL,
    "parent_id" BIGINT NOT NULL DEFAULT 0,
    "name" VARCHAR(50) NOT NULL,
    "code" VARCHAR(100) NOT NULL UNIQUE,
    "type" VARCHAR(20) DEFAULT 'menu',
    "path" VARCHAR(200),
    "icon" VARCHAR(50),
    "component" VARCHAR(200),
    "sort" INT DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "description" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_user_permission" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sys_user_permission_code" ON "sys_user_permission" ("code");
CREATE INDEX "idx_sys_user_permission_parent_id" ON "sys_user_permission" ("parent_id");
CREATE INDEX "idx_sys_user_permission_status" ON "sys_user_permission" ("status");
CREATE INDEX "idx_sys_user_permission_type" ON "sys_user_permission" ("type");

-- 用户组权限关联表（app/web 会员中心）
CREATE TABLE "sys_user_role_permission" (
    "id" BIGSERIAL NOT NULL,
    "user_group_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_user_role_permission" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_sys_user_role_permission" UNIQUE ("user_group_id", "permission_id")
);
CREATE INDEX "idx_sys_user_role_permission_group" ON "sys_user_role_permission" ("user_group_id");
CREATE INDEX "idx_sys_user_role_permission_perm" ON "sys_user_role_permission" ("permission_id");

-- ==================== 用户订单表 ====================
CREATE TABLE "sys_user_order" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "order_no" VARCHAR(100) NOT NULL UNIQUE,
    "order_type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pay_amount" DECIMAL(10,2) DEFAULT 0,
    "currency" VARCHAR(10) DEFAULT 'CNY',
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "pay_method" VARCHAR(50),
    "pay_trade_no" VARCHAR(100),
    "pay_data" TEXT,
    "snapshot" TEXT,
    "description" VARCHAR(500),
    "remark" VARCHAR(500),
    "extra_data" JSONB,
    "ip" VARCHAR(50),
    "user_agent" VARCHAR(500),
    "paid_at" TIMESTAMP,
    "cancelled_at" TIMESTAMP,
    "completed_at" TIMESTAMP,
    "expired_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_user_order" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sys_user_order_user_id" ON "sys_user_order" ("user_id");
CREATE INDEX "idx_sys_user_order_type" ON "sys_user_order" ("order_type");
CREATE INDEX "idx_sys_user_order_status" ON "sys_user_order" ("status");
CREATE INDEX "idx_sys_user_order_created" ON "sys_user_order" ("created_at");
CREATE INDEX "idx_sys_user_order_paid" ON "sys_user_order" ("paid_at");

-- 操作日志表
CREATE TABLE "sys_operation_log" (
    "id" BIGSERIAL NOT NULL,
    "user_type" VARCHAR(20) NOT NULL,
    "user_id" BIGINT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "params" TEXT,
    "ip" VARCHAR(50),
    "user_agent" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'success',
    "error_msg" VARCHAR(500),
    "duration" INT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_operation_log" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sys_operation_log_user_type" ON "sys_operation_log" ("user_type");
CREATE INDEX "idx_sys_operation_log_user_id" ON "sys_operation_log" ("user_id");
CREATE INDEX "idx_sys_operation_log_created_at" ON "sys_operation_log" ("created_at");
CREATE INDEX "idx_sys_operation_log_status" ON "sys_operation_log" ("status");

-- 登录日志表
CREATE TABLE "sys_login_log" (
    "id" BIGSERIAL NOT NULL,
    "user_type" VARCHAR(20) NOT NULL,
    "user_id" BIGINT,
    "username" VARCHAR(50) NOT NULL,
    "ip" VARCHAR(50) NOT NULL,
    "location" VARCHAR(100),
    "browser" VARCHAR(100),
    "os" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'success',
    "message" VARCHAR(200),
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_login_log" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sys_login_log_user_type" ON "sys_login_log" ("user_type");
CREATE INDEX "idx_sys_login_log_user_id" ON "sys_login_log" ("user_id");
CREATE INDEX "idx_sys_login_log_created_at" ON "sys_login_log" ("created_at");
CREATE INDEX "idx_sys_login_log_status" ON "sys_login_log" ("status");

-- 系统配置表
CREATE TABLE "sys_config" (
    "id" BIGSERIAL NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "config_key" VARCHAR(100) NOT NULL UNIQUE,
    "config_value" TEXT NOT NULL,
    "description" VARCHAR(200),
    "type" VARCHAR(20) DEFAULT 'string',
    "is_public" BOOLEAN DEFAULT FALSE,
    "sort" INT DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_config" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sys_config_key" ON "sys_config" ("config_key");
CREATE INDEX "idx_sys_config_category" ON "sys_config" ("category");

-- 文件上传表
CREATE TABLE "sys_upload" (
    "id" BIGSERIAL NOT NULL,
    "user_type" VARCHAR(20) NOT NULL,
    "user_id" BIGINT,
    "category" VARCHAR(50) NOT NULL,
    "filename" VARCHAR(200) NOT NULL,
    "filepath" VARCHAR(500) NOT NULL,
    "filesize" BIGINT NOT NULL,
    "mimetype" VARCHAR(100) NOT NULL,
    "file_ext" VARCHAR(10) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_upload" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sys_upload_user_type" ON "sys_upload" ("user_type");
CREATE INDEX "idx_sys_upload_user_id" ON "sys_upload" ("user_id");
CREATE INDEX "idx_sys_upload_category" ON "sys_upload" ("category");
CREATE INDEX "idx_sys_upload_created_at" ON "sys_upload" ("created_at");

-- 消息通知表
CREATE TABLE "sys_notification" (
    "id" BIGSERIAL NOT NULL,
    "user_type" VARCHAR(20) NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" VARCHAR(20) DEFAULT 'system',
    "title" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "link" VARCHAR(500),
    "is_read" BOOLEAN DEFAULT FALSE,
    "read_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_notification" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sys_notification_user_type" ON "sys_notification" ("user_type");
CREATE INDEX "idx_sys_notification_user_id" ON "sys_notification" ("user_id");
CREATE INDEX "idx_sys_notification_is_read" ON "sys_notification" ("is_read");
CREATE INDEX "idx_sys_notification_created_at" ON "sys_notification" ("created_at");

-- 用户积分表
CREATE TABLE "sys_user_score" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INT NOT NULL,
    "admin_id" INT,
    "scene" VARCHAR(50) NOT NULL,
    "change_score" DECIMAL(10,2) NOT NULL,
    "before_score" DECIMAL(10,2) NOT NULL,
    "after_score" DECIMAL(10,2) NOT NULL,
    "remark" VARCHAR(500),
    "order_no" VARCHAR(100),
    "ip" VARCHAR(50),
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_user_score" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sys_user_score_user_id" ON "sys_user_score" ("user_id");
CREATE INDEX "idx_sys_user_score_scene" ON "sys_user_score" ("scene");
CREATE INDEX "idx_sys_user_score_created_at" ON "sys_user_score" ("created_at");
CREATE INDEX "idx_sys_user_score_order_no" ON "sys_user_score" ("order_no");

-- 用户余额表
CREATE TABLE "sys_user_balance" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INT NOT NULL,
    "admin_id" INT,
    "scene" VARCHAR(50) NOT NULL,
    "change_balance" DECIMAL(10,2) NOT NULL,
    "before_balance" DECIMAL(10,2) NOT NULL,
    "after_balance" DECIMAL(10,2) NOT NULL,
    "remark" VARCHAR(500),
    "order_no" VARCHAR(100),
    "ip" VARCHAR(50),
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_user_balance" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sys_user_balance_user_id" ON "sys_user_balance" ("user_id");
CREATE INDEX "idx_sys_user_balance_scene" ON "sys_user_balance" ("scene");
CREATE INDEX "idx_sys_user_balance_created_at" ON "sys_user_balance" ("created_at");
CREATE INDEX "idx_sys_user_balance_order_no" ON "sys_user_balance" ("order_no");

-- 短信验证码表
CREATE TABLE "sms_code" (
    "id" BIGSERIAL NOT NULL,
    "mobile" VARCHAR(11) NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "expired_at" TIMESTAMP NOT NULL,
    "used" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sms_code" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sms_code_mobile" ON "sms_code" ("mobile");
CREATE INDEX "idx_sms_code_type" ON "sms_code" ("type");
CREATE INDEX "idx_sms_code_used" ON "sms_code" ("used");
CREATE INDEX "idx_sms_code_mobile_type_used" ON "sms_code" ("mobile", "type", "used");
CREATE INDEX "idx_sms_code_expired_at" ON "sms_code" ("expired_at");

-- ==================== 初始化用户权限数据（app/web 会员中心） ====================
-- 会员中心默认菜单权限
-- 先插入父节点
INSERT INTO "sys_user_permission" ("name", "code", "type", "path", "icon", "sort", "status", "parent_id") VALUES
('会员首页', 'member:home', 'menu', '/member', 'HomeOutlined', 1, 'normal', 0),
('个人信息', 'member:profile', 'menu', '/member/profile', 'UserOutlined', 2, 'normal', 0),
('充值中心', 'recharge:center', 'menu', NULL, 'PayCircleOutlined', 3, 'normal', 0),
('交易记录', 'records:center', 'menu', NULL, 'HistoryOutlined', 4, 'normal', 0)
ON CONFLICT ("code") DO NOTHING;

-- 然后插入子节点，使用父节点的ID
INSERT INTO "sys_user_permission" ("name", "code", "type", "path", "icon", "sort", "status", "parent_id")
SELECT
  '余额充值',
  'recharge:balance',
  'menu',
  '/recharge/balance',
  'WalletOutlined',
  1,
  'normal',
  (SELECT id FROM sys_user_permission WHERE code = 'recharge:center' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM sys_user_permission WHERE code = 'recharge:balance')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "sys_user_permission" ("name", "code", "type", "path", "icon", "sort", "status", "parent_id")
SELECT
  '积分充值',
  'recharge:score',
  'menu',
  '/recharge/score',
  'GiftOutlined',
  2,
  'normal',
  (SELECT id FROM sys_user_permission WHERE code = 'recharge:center' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM sys_user_permission WHERE code = 'recharge:score')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "sys_user_permission" ("name", "code", "type", "path", "icon", "sort", "status", "parent_id")
SELECT
  '余额记录',
  'records:balance',
  'menu',
  '/member/records/balance',
  'WalletOutlined',
  1,
  'normal',
  (SELECT id FROM sys_user_permission WHERE code = 'records:center' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM sys_user_permission WHERE code = 'records:balance')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "sys_user_permission" ("name", "code", "type", "path", "icon", "sort", "status", "parent_id")
SELECT
  '积分记录',
  'records:score',
  'menu',
  '/member/records/score',
  'GiftOutlined',
  2,
  'normal',
  (SELECT id FROM sys_user_permission WHERE code = 'records:center' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM sys_user_permission WHERE code = 'records:score')
ON CONFLICT ("code") DO NOTHING;
