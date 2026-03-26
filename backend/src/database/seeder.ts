import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SysAdmin } from '../entities/sys-admin.entity';
import { SysAdminGroup } from '../entities/sys-admin-group.entity';
import { SysUser } from '../entities/sys-user.entity';
import { SysUserGroup } from '../entities/sys-user-group.entity';
import { SysPermission } from '../entities/sys-permission.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'niujinhui',
  password: '',
  database: 'system_admin',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('数据库连接成功');

  const adminGroupRepo = AppDataSource.getRepository(SysAdminGroup);
  const adminRepo = AppDataSource.getRepository(SysAdmin);
  const userGroupRepo = AppDataSource.getRepository(SysUserGroup);
  const userRepo = AppDataSource.getRepository(SysUser);
  const permissionRepo = AppDataSource.getRepository(SysPermission);

  // 1. 创建超级管理员组
  const superAdminGroup = adminGroupRepo.create({
    name: '超级管理员组',
    description: '拥有所有权限的超级管理员组',
    permissions: JSON.stringify(['*']),
    status: 'normal',
  });
  await adminGroupRepo.save(superAdminGroup);
  console.log('超级管理员组创建成功');

  // 2. 创建超级管理员
  const hashedPassword = await bcrypt.hash('Admin@888888', 10);
  const superAdmin = adminRepo.create({
    groupId: superAdminGroup.id,
    username: 'admin',
    nickname: '超级管理员',
    password: hashedPassword,
    email: 'admin@example.com',
    mobile: '13800138000',
    status: 'normal',
    loginFailure: 0,
  });
  await adminRepo.save(superAdmin);
  console.log('超级管理员创建成功');
  console.log('用户名: admin');
  console.log('密码: Admin@888888');

  // 3. 创建默认用户组
  const defaultUserGroup = userGroupRepo.create({
    name: '默认用户组',
    description: '普通用户默认所属组',
    permissions: JSON.stringify([]),
    status: 'normal',
  });
  await userGroupRepo.save(defaultUserGroup);
  console.log('默认用户组创建成功');

  // 4. 创建示例用户
  const userPassword = await bcrypt.hash('User@888888', 10);
  const exampleUser = userRepo.create({
    groupId: defaultUserGroup.id,
    username: 'user',
    nickname: '示例用户',
    password: userPassword,
    email: 'user@example.com',
    mobile: '13800138001',
    status: 'normal',
    gender: 'unknown',
  });
  await userRepo.save(exampleUser);
  console.log('示例用户创建成功');

  // 5. 创建默认权限
  // 一级菜单 (parentId = 0)
  const defaultPermissions = [
    { name: '仪表盘', code: 'dashboard', type: 'menu', path: '/admin/dashboard', icon: 'DashboardOutlined', parentId: 0, sort: 0 },
    { name: '用户管理', code: 'user', type: 'menu', path: '/admin/user', icon: 'UserOutlined', parentId: 0, sort: 1 },
    { name: '系统管理', code: 'system', type: 'menu', path: '/admin/system', icon: 'SettingOutlined', parentId: 0, sort: 2 },
    { name: '日志管理', code: 'log', type: 'menu', path: '/admin/log', icon: 'FileTextOutlined', parentId: 0, sort: 3 },
    { name: '消息通知', code: 'notification', type: 'menu', path: '/admin/message/list', icon: 'BellOutlined', parentId: 0, sort: 4 },
  ];

  // 二级菜单 (parentId 指向对应的一级菜单)
  const childPermissions = [
    // 用户管理子菜单
    { name: '用户列表', code: 'user:list', type: 'menu', path: '/admin/user/list', icon: 'UserOutlined', parentId: 0, sort: 0 },
    { name: '用户组', code: 'user:group', type: 'menu', path: '/admin/user/group', icon: 'TeamOutlined', parentId: 0, sort: 1 },
    // 系统管理子菜单
    { name: '管理员管理', code: 'system:admin', type: 'menu', path: '/admin/system/admin', icon: 'UserOutlined', parentId: 0, sort: 0 },
    { name: '管理员组管理', code: 'system:admin-group', type: 'menu', path: '/admin/system/admin/group', icon: 'TeamOutlined', parentId: 0, sort: 1 },
    { name: '权限管理', code: 'system:permission', type: 'menu', path: '/admin/system/permission', icon: 'KeyOutlined', parentId: 0, sort: 2 },
    { name: '系统配置', code: 'system:config', type: 'menu', path: '/admin/system/config', icon: 'SettingOutlined', parentId: 0, sort: 3 },
    { name: '文件管理', code: 'system:file', type: 'menu', path: '/admin/system/file', icon: 'UploadOutlined', parentId: 0, sort: 4 },
    // 日志管理子菜单
    { name: '操作日志', code: 'log:operation', type: 'menu', path: '/admin/log/operation', icon: 'FileSearchOutlined', parentId: 0, sort: 0 },
    { name: '登录日志', code: 'log:login', type: 'menu', path: '/admin/log/login', icon: 'LoginOutlined', parentId: 0, sort: 1 },
  ];

  // 保存一级菜单
  const permissionMap = new Map<string, number>();
  for (const perm of defaultPermissions) {
    const permission = permissionRepo.create(perm);
    await permissionRepo.save(permission);
    permissionMap.set(perm.code, permission.id);
  }
  console.log('一级权限创建成功');

  // 设置二级菜单的 parentId 并保存
  const childPermissionMap = new Map<string, number>();
  for (const perm of childPermissions) {
    let parentId = 0;
    if (perm.code.startsWith('user:')) {
      parentId = permissionMap.get('user') || 0;
    } else if (perm.code.startsWith('system:')) {
      parentId = permissionMap.get('system') || 0;
    } else if (perm.code.startsWith('log:')) {
      parentId = permissionMap.get('log') || 0;
    }
    const permission = permissionRepo.create({ ...perm, parentId });
    await permissionRepo.save(permission);
    childPermissionMap.set(perm.code, permission.id);
  }
  console.log('二级权限创建成功');

  // 创建按钮权限
  const buttonPermissions = [
    // 用户列表按钮权限
    { name: '新增用户', code: 'user:list:create', type: 'button', parentCode: 'user:list', sort: 0 },
    { name: '编辑用户', code: 'user:list:edit', type: 'button', parentCode: 'user:list', sort: 1 },
    { name: '删除用户', code: 'user:list:delete', type: 'button', parentCode: 'user:list', sort: 2 },

    // 用户组按钮权限
    { name: '新增用户组', code: 'user:group:create', type: 'button', parentCode: 'user:group', sort: 0 },
    { name: '编辑用户组', code: 'user:group:edit', type: 'button', parentCode: 'user:group', sort: 1 },
    { name: '删除用户组', code: 'user:group:delete', type: 'button', parentCode: 'user:group', sort: 2 },

    // 管理员管理按钮权限
    { name: '新增管理员', code: 'system:admin:create', type: 'button', parentCode: 'system:admin', sort: 0 },
    { name: '编辑管理员', code: 'system:admin:edit', type: 'button', parentCode: 'system:admin', sort: 1 },
    { name: '删除管理员', code: 'system:admin:delete', type: 'button', parentCode: 'system:admin', sort: 2 },
    { name: '重置密码', code: 'system:admin:reset-password', type: 'button', parentCode: 'system:admin', sort: 3 },

    // 管理员组管理按钮权限
    { name: '新增管理员组', code: 'system:admin-group:create', type: 'button', parentCode: 'system:admin-group', sort: 0 },
    { name: '编辑管理员组', code: 'system:admin-group:edit', type: 'button', parentCode: 'system:admin-group', sort: 1 },
    { name: '删除管理员组', code: 'system:admin-group:delete', type: 'button', parentCode: 'system:admin-group', sort: 2 },

    // 权限管理按钮权限
    { name: '新增权限', code: 'system:permission:create', type: 'button', parentCode: 'system:permission', sort: 0 },
    { name: '编辑权限', code: 'system:permission:edit', type: 'button', parentCode: 'system:permission', sort: 1 },
    { name: '删除权限', code: 'system:permission:delete', type: 'button', parentCode: 'system:permission', sort: 2 },

    // 系统配置按钮权限
    { name: '新增配置', code: 'system:config:create', type: 'button', parentCode: 'system:config', sort: 0 },
    { name: '编辑配置', code: 'system:config:edit', type: 'button', parentCode: 'system:config', sort: 1 },
    { name: '删除配置', code: 'system:config:delete', type: 'button', parentCode: 'system:config', sort: 2 },

    // 文件管理按钮权限（根据实际情况添加）
    { name: '上传文件', code: 'system:file:upload', type: 'button', parentCode: 'system:file', sort: 0 },
    { name: '删除文件', code: 'system:file:delete', type: 'button', parentCode: 'system:file', sort: 1 },

    // 操作日志按钮权限
    { name: '查看日志', code: 'log:operation:view', type: 'button', parentCode: 'log:operation', sort: 0 },

    // 登录日志按钮权限
    { name: '查看日志', code: 'log:login:view', type: 'button', parentCode: 'log:login', sort: 0 },
  ];

  for (const buttonPerm of buttonPermissions) {
    const parentId = childPermissionMap.get(buttonPerm.parentCode) || 0;
    const permission = permissionRepo.create({
      name: buttonPerm.name,
      code: buttonPerm.code,
      type: buttonPerm.type,
      parentId,
      sort: buttonPerm.sort,
      status: 'normal',
    });
    await permissionRepo.save(permission);
  }
  console.log('按钮权限创建成功');

  await AppDataSource.destroy();
  console.log('Seeder 执行完成');
}

seed().catch((error) => {
  console.error('Seeder 执行失败:', error);
  process.exit(1);
});
