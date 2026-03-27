import { useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Typography, Row, Col, Card } from 'antd';
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

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function MemberLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { member, logout, isAuthenticated } = useAuthStore();
  const { profile, fetchProfile } = useMemberStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [isAuthenticated, navigate, fetchProfile]);

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

  const menuItems = [
    {
      key: '/member',
      icon: <HomeOutlined />,
      label: <Link to="/member">会员首页</Link>,
    },
    {
      key: '/member/profile',
      icon: <UserOutlined />,
      label: <Link to="/member/profile">个人信息</Link>,
    },
    {
      key: 'recharge',
      icon: <PayCircleOutlined />,
      label: '充值中心',
      children: [
        {
          key: '/recharge/balance',
          icon: <WalletOutlined />,
          label: <Link to="/recharge/balance">余额充值</Link>,
        },
        {
          key: '/recharge/score',
          icon: <GiftOutlined />,
          label: <Link to="/recharge/score">积分充值</Link>,
        },
      ],
    },
    {
      key: 'records',
      icon: <HistoryOutlined />,
      label: '交易记录',
      children: [
        {
          key: '/member/records/balance',
          icon: <WalletOutlined />,
          label: <Link to="/member/records/balance">余额记录</Link>,
        },
        {
          key: '/member/records/score',
          icon: <GiftOutlined />,
          label: <Link to="/member/records/score">积分记录</Link>,
        },
      ],
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
          <Menu
            mode="inline"
            selectedKeys={[currentPath]}
            defaultOpenKeys={['recharge', 'records']}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
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
