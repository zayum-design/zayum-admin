-- 添加积分日志和余额日志菜单
-- Migration: Add user score and balance menu permissions
-- Date: 2026-03-27

-- 获取用户管理菜单的ID
DO $$
DECLARE
    user_menu_id BIGINT;
    score_menu_id BIGINT;
    balance_menu_id BIGINT;
BEGIN
    -- 查找用户管理菜单的ID
    SELECT id INTO user_menu_id FROM sys_permission WHERE code = 'user' AND type = 'menu';
    
    -- 如果找不到用户管理菜单，使用默认值0
    IF user_menu_id IS NULL THEN
        user_menu_id := 0;
    END IF;

    -- 插入积分日志菜单（如果不存在）
    INSERT INTO sys_permission (name, code, type, path, icon, parent_id, sort, status, created_at, updated_at)
    SELECT '积分日志', 'user:score', 'menu', '/admin/user/score', 'FileTextOutlined', user_menu_id, 2, 'normal', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM sys_permission WHERE code = 'user:score' AND type = 'menu');

    -- 获取积分日志菜单的ID
    SELECT id INTO score_menu_id FROM sys_permission WHERE code = 'user:score' AND type = 'menu';

    -- 插入余额日志菜单（如果不存在）
    INSERT INTO sys_permission (name, code, type, path, icon, parent_id, sort, status, created_at, updated_at)
    SELECT '余额日志', 'user:balance', 'menu', '/admin/user/balance', 'FileTextOutlined', user_menu_id, 3, 'normal', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM sys_permission WHERE code = 'user:balance' AND type = 'menu');

    -- 获取余额日志菜单的ID
    SELECT id INTO balance_menu_id FROM sys_permission WHERE code = 'user:balance' AND type = 'menu';

    -- 插入积分日志按钮权限（如果不存在）
    INSERT INTO sys_permission (name, code, type, parent_id, sort, status, created_at, updated_at)
    SELECT '查看积分日志', 'user:score:view', 'button', score_menu_id, 0, 'normal', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM sys_permission WHERE code = 'user:score:view' AND type = 'button');

    INSERT INTO sys_permission (name, code, type, parent_id, sort, status, created_at, updated_at)
    SELECT '删除积分日志', 'user:score:delete', 'button', score_menu_id, 1, 'normal', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM sys_permission WHERE code = 'user:score:delete' AND type = 'button');

    -- 插入余额日志按钮权限（如果不存在）
    INSERT INTO sys_permission (name, code, type, parent_id, sort, status, created_at, updated_at)
    SELECT '查看余额日志', 'user:balance:view', 'button', balance_menu_id, 0, 'normal', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM sys_permission WHERE code = 'user:balance:view' AND type = 'button');

    INSERT INTO sys_permission (name, code, type, parent_id, sort, status, created_at, updated_at)
    SELECT '删除余额日志', 'user:balance:delete', 'button', balance_menu_id, 1, 'normal', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM sys_permission WHERE code = 'user:balance:delete' AND type = 'button');

END $$;

-- 添加注释
COMMENT ON COLUMN sys_permission.name IS '权限名称';
COMMENT ON COLUMN sys_permission.code IS '权限代码';
COMMENT ON COLUMN sys_permission.type IS '权限类型：menu-菜单，button-按钮，api-接口';
COMMENT ON COLUMN sys_permission.path IS '菜单路径';
COMMENT ON COLUMN sys_permission.icon IS '菜单图标';
COMMENT ON COLUMN sys_permission.parent_id IS '父权限ID，0表示顶级菜单';
COMMENT ON COLUMN sys_permission.sort IS '排序序号';
