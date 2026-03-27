-- 添加代码生成器菜单
-- 执行条件：系统管理菜单已存在

-- 1. 先获取系统管理菜单的 ID
DO $$
DECLARE
    system_menu_id BIGINT;
    code_generator_menu_id BIGINT;
BEGIN
    -- 查找系统管理菜单
    SELECT id INTO system_menu_id FROM sys_permission WHERE code = 'system' AND type = 'menu';
    
    IF system_menu_id IS NULL THEN
        RAISE NOTICE '系统管理菜单不存在，请先运行 seeder';
        RETURN;
    END IF;
    
    -- 检查是否已存在代码生成器菜单
    SELECT id INTO code_generator_menu_id FROM sys_permission WHERE code = 'system:code-generator';
    
    IF code_generator_menu_id IS NOT NULL THEN
        RAISE NOTICE '代码生成器菜单已存在，跳过插入';
        RETURN;
    END IF;
    
    -- 插入代码生成器菜单
    INSERT INTO sys_permission (parent_id, name, code, type, path, icon, sort, status, created_at, updated_at)
    VALUES (system_menu_id, '代码生成器', 'system:code-generator', 'menu', '/admin/code-generator', 'CodeOutlined', 5, 'normal', NOW(), NOW());
    
    RAISE NOTICE '代码生成器菜单添加成功';
END $$;
