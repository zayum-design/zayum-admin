import { useEffect, useState } from 'react';
import { Layout, Dropdown, Avatar, Badge, Space, Button, Breadcrumb } from 'antd';
import {
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useNotificationStore } from '../store/notification.store';
import { SideMenu } from '../components/SideMenu';

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchUnreadCount, fetchLatestNotifications, latestNotifications } = useNotificationStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    fetchLatestNotifications(5);

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount, fetchLatestNotifications]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/admin/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const notificationItems = [
    {
      key: 'header',
      label: <div className="font-bold py-1">通知中心</div>,
    },
    {
      type: 'divider' as const,
    },
    ...latestNotifications.map((n) => ({
      key: n.id,
      label: (
        <div className="py-1 max-w-xs">
          <div className="flex items-start">
            {!n.isRead && <span className="text-red-500 mr-1">●</span>}
            <div className="flex-1 overflow-hidden">
              <div className="font-medium truncate">{n.title}</div>
              <div className="text-gray-400 text-xs truncate">{n.content}</div>
            </div>
          </div>
        </div>
      ),
      onClick: () => {
        if (n.link) {
          navigate(n.link);
        } else {
          navigate('/admin/message/list');
        }
      },
    })),
    {
      type: 'divider' as const,
    },
    {
      key: 'viewAll',
      label: (
        <div className="text-center">
          <Button type="link" size="small" onClick={() => navigate('/admin/message/list')}>
            查看全部
          </Button>
        </div>
      ),
    },
  ];

  // Generate breadcrumbs from current path
  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const breadcrumbs = pathSnippets.map((snippet, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    return {
      key: url,
      title: formatBreadcrumbTitle(snippet),
    };
  });

  function formatBreadcrumbTitle(path: string): string {
    const titleMap: Record<string, string> = {
      dashboard: '首页',
      system: '系统管理',
      permission: '权限管理',
      admin: '管理员',
      'admin-group': '管理员组',
      config: '系统配置',
      file: '文件管理',
      user: '用户管理',
      list: '用户列表',
      group: '用户组',
      log: '日志管理',
      operation: '操作日志',
      login: '登录日志',
      message: '消息中心',
      profile: '个人中心',
    };
    return titleMap[path] || path;
  }

  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center justify-between bg-white shadow-sm px-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 64 }}>
        <Space>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 48, height: 48 }}
          />
          <div className="text-xl font-bold cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
            Zayum Admin
          </div>
        </Space>
        <Space>
          <Dropdown
            menu={{ items: notificationItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
              <BellOutlined className="text-xl cursor-pointer" />
            </Badge>
          </Dropdown>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center cursor-pointer">
              <Avatar size="small" icon={<UserOutlined />} src={user?.avatar} />
              <span className="ml-2">{user?.nickname || user?.username || 'Admin'}</span>
            </div>
          </Dropdown>
        </Space>
      </Header>
      <Layout style={{ marginTop: 64 }}>
        <Sider
          width={200}
          collapsedWidth={64}
          collapsed={collapsed}
          className="bg-white"
          style={{
            position: 'fixed',
            left: 0,
            top: 64,
            bottom: 0,
            overflow: 'auto',
            transition: 'all 0.2s',
          }}
        >
          <SideMenu collapsed={collapsed} />
        </Sider>
        <Layout style={{ marginLeft: collapsed ? 64 : 200, transition: 'margin-left 0.2s' }}>
          <Content className="p-6 bg-gray-50 min-h-screen">
            {breadcrumbs.length > 0 && (
              <Breadcrumb
                style={{ marginBottom: 16 }}
                items={[
                  {
                    key: 'home',
                    title: (
                      <HomeOutlined onClick={() => navigate('/admin/dashboard')} className="cursor-pointer" />
                    ),
                  },
                  ...breadcrumbs.map((item) => ({
                    key: item.key,
                    title: item.title,
                  })),
                ]}
              />
            )}
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
