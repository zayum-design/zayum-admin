-- 创建用户余额变动日志表
-- Migration: Create sys_user_balance table for tracking user balance changes
-- Date: 2026-03-27

CREATE TABLE IF NOT EXISTS sys_user_balance (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    admin_id INT NULL COMMENT '管理员ID（操作用户）',
    scene VARCHAR(50) NOT NULL COMMENT '余额场景（如：recharge, consume, refund, admin_adjust）',
    change_balance DECIMAL(10, 2) NOT NULL COMMENT '变更余额（正数增加，负数减少）',
    before_balance DECIMAL(10, 2) NOT NULL COMMENT '变更前余额',
    after_balance DECIMAL(10, 2) NOT NULL COMMENT '变更后余额',
    remark VARCHAR(500) NULL COMMENT '备注说明',
    order_no VARCHAR(100) NULL COMMENT '关联订单号',
    ip VARCHAR(50) NULL COMMENT '操作IP地址',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

-- 添加注释
COMMENT ON TABLE sys_user_balance IS '用户余额变动日志表';

-- 为常用查询字段创建索引
CREATE INDEX IF NOT EXISTS idx_user_balance_user_id ON sys_user_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_user_balance_admin_id ON sys_user_balance(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_balance_scene ON sys_user_balance(scene);
CREATE INDEX IF NOT EXISTS idx_user_balance_order_no ON sys_user_balance(order_no);
CREATE INDEX IF NOT EXISTS idx_user_balance_created_at ON sys_user_balance(created_at);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sys_user_balance_updated_at ON sys_user_balance;
CREATE TRIGGER update_sys_user_balance_updated_at
    BEFORE UPDATE ON sys_user_balance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
