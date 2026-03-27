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
    "email" VARCHAR(100),
    "mobile" VARCHAR(11),
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
    "email" VARCHAR(100),
    "mobile" VARCHAR(11),
    "gender" VARCHAR(20) DEFAULT 'unknown',
    "birthday" DATE,
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

-- 权限表
CREATE TABLE "sys_permission" (
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
    CONSTRAINT "PK_sys_permission" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sys_permission_code" ON "sys_permission" ("code");
CREATE INDEX "idx_sys_permission_parent_id" ON "sys_permission" ("parent_id");
CREATE INDEX "idx_sys_permission_status" ON "sys_permission" ("status");

-- 角色权限关联表
CREATE TABLE "sys_role_permission" (
    "id" BIGSERIAL NOT NULL,
    "role_type" VARCHAR(20) NOT NULL,
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sys_role_permission" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_sys_role_permission" UNIQUE ("role_type", "role_id", "permission_id")
);

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

