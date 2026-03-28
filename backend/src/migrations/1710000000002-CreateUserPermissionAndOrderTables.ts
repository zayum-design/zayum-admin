import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 创建用户权限表和订单表
 * sys_user_permission: 管理app/web会员中心的菜单和按钮权限
 * sys_user_order: 用户订单主表，记录所有类型的订单
 */
export class CreateUserPermissionAndOrderTables1710000000002 implements MigrationInterface {
  name = 'CreateUserPermissionAndOrderTables1710000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==================== 1. 创建 sys_user_permission 表 ====================
    // 用途：管理 app/web 会员中心的菜单和按钮权限，类似 sys_permission 但用于前端用户系统
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sys_user_permission" (
        "id" BIGSERIAL NOT NULL,
        "parent_id" BIGINT NOT NULL DEFAULT 0,
        "name" VARCHAR(50) NOT NULL,
        "code" VARCHAR(100) NOT NULL,
        "type" VARCHAR(20) DEFAULT 'menu',
        "path" VARCHAR(200),
        "icon" VARCHAR(50),
        "component" VARCHAR(200),
        "sort" INT DEFAULT 0,
        "status" VARCHAR(20) NOT NULL DEFAULT 'normal',
        "description" VARCHAR(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_sys_user_permission" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sys_user_permission_code" UNIQUE ("code")
      )
    `);

    // sys_user_permission 索引
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sys_user_permission_code" ON "sys_user_permission" ("code")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sys_user_permission_parent_id" ON "sys_user_permission" ("parent_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sys_user_permission_status" ON "sys_user_permission" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sys_user_permission_type" ON "sys_user_permission" ("type")`);

    // ==================== 2. 创建 sys_user_role_permission 表 ====================
    // 用途：用户组与权限的关联表，类似 sys_role_permission
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sys_user_role_permission" (
        "id" BIGSERIAL NOT NULL,
        "user_group_id" BIGINT NOT NULL,
        "permission_id" BIGINT NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_sys_user_role_permission" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sys_user_role_permission" UNIQUE ("user_group_id", "permission_id")
      )
    `);

    // sys_user_role_permission 索引
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sys_user_role_permission_group" ON "sys_user_role_permission" ("user_group_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sys_user_role_permission_perm" ON "sys_user_role_permission" ("permission_id")`);

    // ==================== 3. 创建 sys_user_order 表 ====================
    // 用途：用户订单主表，记录积分充值、余额充值等所有订单
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sys_user_order" (
        "id" BIGSERIAL NOT NULL,
        "user_id" BIGINT NOT NULL,
        "order_no" VARCHAR(100) NOT NULL,
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
        CONSTRAINT "PK_sys_user_order" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sys_user_order_no" UNIQUE ("order_no")
      )
    `);

    // sys_user_order 索引
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sys_user_order_user_id" ON "sys_user_order" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sys_user_order_type" ON "sys_user_order" ("order_type")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sys_user_order_status" ON "sys_user_order" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sys_user_order_created" ON "sys_user_order" ("created_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sys_user_order_paid" ON "sys_user_order" ("paid_at")`);

    // ==================== 4. 初始化默认权限数据 ====================
    // 插入 app/web 会员中心默认菜单权限
    await queryRunner.query(`
      INSERT INTO "sys_user_permission" ("name", "code", "type", "path", "icon", "sort", "status") VALUES
      ('会员首页', 'member.home', 'menu', '/member', 'HomeOutlined', 1, 'normal'),
      ('个人信息', 'member.profile', 'menu', '/member/profile', 'UserOutlined', 2, 'normal'),
      ('充值中心', 'member.recharge', 'menu', '', 'PayCircleOutlined', 3, 'normal'),
      ('余额充值', 'member.recharge.balance', 'menu', '/recharge/balance', 'WalletOutlined', 4, 'normal'),
      ('积分充值', 'member.recharge.score', 'menu', '/recharge/score', 'GiftOutlined', 5, 'normal'),
      ('交易记录', 'member.records', 'menu', '', 'HistoryOutlined', 6, 'normal'),
      ('余额记录', 'member.records.balance', 'menu', '/member/records/balance', 'WalletOutlined', 7, 'normal'),
      ('积分记录', 'member.records.score', 'menu', '/member/records/score', 'GiftOutlined', 8, 'normal')
      ON CONFLICT ("code") DO NOTHING
    `);

    console.log('Created sys_user_permission, sys_user_role_permission and sys_user_order tables');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 反向迁移：删除表
    await queryRunner.query(`DROP TABLE IF EXISTS "sys_user_role_permission"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sys_user_permission"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sys_user_order"`);
    console.log('Dropped user permission and order tables');
  }
}
