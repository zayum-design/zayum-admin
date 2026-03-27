-- 添加用户积分和余额字段
-- Migration: Add score and balance columns to sys_user table
-- Date: 2026-03-27

-- 添加积分字段 (默认值为0)
ALTER TABLE sys_user 
ADD COLUMN IF NOT EXISTS score INT NOT NULL DEFAULT 0;

-- 添加余额字段 (默认值为0，保留2位小数)
ALTER TABLE sys_user 
ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- 为积分字段创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_score ON sys_user(score);

-- 为余额字段创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_balance ON sys_user(balance);

-- 添加注释
COMMENT ON COLUMN sys_user.score IS '用户积分';
COMMENT ON COLUMN sys_user.balance IS '用户余额';
