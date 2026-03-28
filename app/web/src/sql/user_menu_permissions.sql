-- ============================================
-- MemberLayout 菜单权限数据插入脚本
-- 表名: sys_user_permission
-- 说明: 用户会员中心菜单权限配置
-- ============================================

-- 先清空现有菜单数据（如果需要重新导入）
-- DELETE FROM sys_user_permission WHERE code LIKE 'member:%' OR code LIKE 'recharge:%' OR code LIKE 'records:%';

-- ============================================
-- 一级菜单
-- ============================================

-- 1. 会员首页
INSERT INTO sys_user_permission (parent_id, name, code, type, path, icon, component, sort, status, description, created_at, updated_at)
VALUES (0, '会员首页', 'member:home', 'menu', '/member', 'HomeOutlined', NULL, 1, 'normal', '会员中心首页', NOW(), NOW());

-- 2. 个人信息
INSERT INTO sys_user_permission (parent_id, name, code, type, path, icon, component, sort, status, description, created_at, updated_at)
VALUES (0, '个人信息', 'member:profile', 'menu', '/member/profile', 'UserOutlined', NULL, 2, 'normal', '会员个人信息管理', NOW(), NOW());

-- 3. 充值中心（父菜单）
INSERT INTO sys_user_permission (parent_id, name, code, type, path, icon, component, sort, status, description, created_at, updated_at)
VALUES (0, '充值中心', 'recharge:center', 'menu', NULL, 'PayCircleOutlined', NULL, 3, 'normal', '充值中心父菜单', NOW(), NOW());

-- 4. 交易记录（父菜单）
INSERT INTO sys_user_permission (parent_id, name, code, type, path, icon, component, sort, status, description, created_at, updated_at)
VALUES (0, '交易记录', 'records:center', 'menu', NULL, 'HistoryOutlined', NULL, 4, 'normal', '交易记录父菜单', NOW(), NOW());

-- ============================================
-- 获取父菜单 ID（用于设置子菜单的 parent_id）
-- 注意: 下面使用子查询获取父菜单 ID，实际执行时请确保父菜单已插入
-- ============================================

-- 5. 余额充值（充值中心子菜单）
INSERT INTO sys_user_permission (parent_id, name, code, type, path, icon, component, sort, status, description, created_at, updated_at)
SELECT id, '余额充值', 'recharge:balance', 'menu', '/recharge/balance', 'WalletOutlined', NULL, 1, 'normal', '余额充值功能', NOW(), NOW()
FROM sys_user_permission WHERE code = 'recharge:center';

-- 6. 积分充值（充值中心子菜单）
INSERT INTO sys_user_permission (parent_id, name, code, type, path, icon, component, sort, status, description, created_at, updated_at)
SELECT id, '积分充值', 'recharge:score', 'menu', '/recharge/score', 'GiftOutlined', NULL, 2, 'normal', '积分充值功能', NOW(), NOW()
FROM sys_user_permission WHERE code = 'recharge:center';

-- 7. 余额记录（交易记录子菜单）
INSERT INTO sys_user_permission (parent_id, name, code, type, path, icon, component, sort, status, description, created_at, updated_at)
SELECT id, '余额记录', 'records:balance', 'menu', '/member/records/balance', 'WalletOutlined', NULL, 1, 'normal', '余额交易记录', NOW(), NOW()
FROM sys_user_permission WHERE code = 'records:center';

-- 8. 积分记录（交易记录子菜单）
INSERT INTO sys_user_permission (parent_id, name, code, type, path, icon, component, sort, status, description, created_at, updated_at)
SELECT id, '积分记录', 'records:score', 'menu', '/member/records/score', 'GiftOutlined', NULL, 2, 'normal', '积分交易记录', NOW(), NOW()
FROM sys_user_permission WHERE code = 'records:center';

-- ============================================
-- 查询验证
-- ============================================
-- 查看所有菜单权限
-- SELECT * FROM sys_user_permission WHERE type = 'menu' ORDER BY parent_id, sort;

-- 查看菜单树结构
-- SELECT 
--     p.id,
--     p.name,
--     p.code,
--     p.path,
--     p.icon,
--     p.parent_id,
--     p.sort,
--     CASE WHEN p.parent_id = 0 THEN '一级菜单' ELSE '子菜单' END as menu_level
-- FROM sys_user_permission p
-- WHERE p.type = 'menu'
-- ORDER BY p.parent_id, p.sort;
