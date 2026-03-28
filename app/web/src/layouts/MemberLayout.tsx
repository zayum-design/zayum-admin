import { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Typography, Row, Col, Card, Spin } from 'antd';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  UserOutlined,
  WalletOutlined,
  GiftOutlined,
  HistoryOutlined,
  LogoutOutlined,
  SettingOutlined,
  HomeOutlined,
  PayCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/auth.store';
import { useMemberStore } from '../store/member.store';
import { menuService, type MenuItem } from '../services/menu.service';
import type { ReactNode } from 'react';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// 图标映射表
const iconMapping: Record<string, ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  UserOutlined: <UserOutlined />,
  PayCircleOutlined: <PayCircleOutlined />,
  WalletOutlined: <WalletOutlined />,
  GiftOutlined: <GiftOutlined />,
  HistoryOutlined: <HistoryOutlined />,
};

// 将后端菜单数据转换为 Ant Design Menu 组件需要的格式
const convertMenuData = (menus: MenuItem[]): any[] => {
  return menus.map((menu) => {
    const menuItem: any = {
      key: menu.path || menu.code,
      icon: menu.icon ? iconMapping[menu.icon] || null : null,
      label: menu.path ? <Link to={menu.path}>{menu.name}</Link> : menu.name,
    };

    // 如果有子菜单，递归转换
    if (menu.children && menu.children.length > 0) {
      menuItem.children = convertMenuData(menu.children);
    }

    return menuItem;
  });
};

// 获取默认展开的菜单 key
const getDefaultOpenKeys = (menus: MenuItem[]): string[] => {
  const keys: string[] = [];
  menus.forEach((menu) => {
    if (menu.children && menu.children.length > 0) {
      keys.push(menu.code);
    }
  });
  return keys;
};

export default function MemberLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { member, logout, isAuthenticated } = useAuthStore();
  const { profile, fetchProfile } = useMemberStore();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [defaultOpenKeys, setDefaultOpenKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [isAuthenticated, navigate, fetchProfile]);

  // 获取菜单数据
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true);
        const response = await menuService.getUserMenus();
        if (response.code === 200 && response.data) {
          const convertedMenus = convertMenuData(response.data);
          setMenuItems(convertedMenus);
          setDefaultOpenKeys(getDefaultOpenKeys(response.data));
        }
      } catch (error) {
        console.error('获取菜单失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchMenus();
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/member/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const currentPath = location.pathname;

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm px-6 flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-xl font-bold text-blue-600 mr-8">会员中心</div>
        </div>
        <div className="flex items-center gap-4">
          <Row gutter={16}>
            <Col>
              <Card size="small" className="bg-blue-50 border-0">
                <div className="flex items-center gap-2">
                  <WalletOutlined className="text-blue-500" />
                  <Text strong>余额: ¥{profile?.balance || 0}</Text>
                </div>
              </Card>
            </Col>
            <Col>
              <Card size="small" className="bg-orange-50 border-0">
                <div className="flex items-center gap-2">
                  <GiftOutlined className="text-orange-500" />
                  <Text strong>积分: {profile?.score || 0}</Text>
                </div>
              </Card>
            </Col>
          </Row>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded">
              <Avatar 
                src={profile?.avatar} 
                icon={<UserOutlined />} 
                size="default"
              />
              <Text>{profile?.nickname || profile?.mobile || '会员'}</Text>
            </div>
          </Dropdown>
        </div>
      </Header>
      
      <Layout>
        <Sider width={200} className="bg-white">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Spin size="small" />
            </div>
          ) : (
            <Menu
              mode="inline"
              selectedKeys={[currentPath]}
              defaultOpenKeys={defaultOpenKeys}
              style={{ height: '100%', borderRight: 0 }}
              items={menuItems}
            />
          )}
        </Sider>
        
        <Content className="p-6 bg-gray-50">
          <div className="min-h-[calc(100vh-64px-48px)]">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
