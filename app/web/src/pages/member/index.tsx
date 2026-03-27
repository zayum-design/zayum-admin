import { useEffect } from 'react';
import { Card, Row, Col, Avatar, Typography, Button, Statistic, Divider, List, Tag } from 'antd';
import { 
  UserOutlined, 
  WalletOutlined, 
  GiftOutlined, 
  ArrowRightOutlined,
  PayCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMemberStore } from '../../store/member.store';
import { useAuthStore } from '../../store/auth.store';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function MemberHome() {
  const navigate = useNavigate();
  const { profile, balanceRecords, scoreRecords, fetchProfile, fetchBalanceRecords, fetchScoreRecords } = useMemberStore();

  useEffect(() => {
    fetchProfile();
    fetchBalanceRecords();
    fetchScoreRecords();
  }, [fetchProfile, fetchBalanceRecords, fetchScoreRecords]);

  const quickActions = [
    {
      title: '余额充值',
      icon: <WalletOutlined className="text-2xl text-blue-500" />,
      desc: '快速充值账户余额',
      path: '/recharge/balance',
      color: 'bg-blue-50',
    },
    {
      title: '积分充值',
      icon: <GiftOutlined className="text-2xl text-orange-500" />,
      desc: '兑换会员积分',
      path: '/recharge/score',
      color: 'bg-orange-50',
    },
    {
      title: '余额记录',
      icon: <HistoryOutlined className="text-2xl text-green-500" />,
      desc: '查看余额变动',
      path: '/member/records/balance',
      color: 'bg-green-50',
    },
    {
      title: '积分记录',
      icon: <HistoryOutlined className="text-2xl text-purple-500" />,
      desc: '查看积分变动',
      path: '/member/records/score',
      color: 'bg-purple-50',
    },
  ];

  const recentBalanceRecords = balanceRecords.slice(0, 5);
  const recentScoreRecords = scoreRecords.slice(0, 5);

  return (
    <div>
      {/* 会员信息卡片 */}
      <Card className="mb-6">
        <div className="flex items-center gap-6">
          <Avatar 
            size={80} 
            src={profile?.avatar} 
            icon={<UserOutlined />} 
          />
          <div className="flex-1">
            <Title level={4} className="!mb-2">{profile?.nickname || '未设置昵称'}</Title>
            <Text className="text-gray-500 block mb-2">手机号: {profile?.mobile}</Text>
            <div className="flex gap-4">
              <Tag color="blue">会员ID: {profile?.id}</Tag>
              <Tag color="green">{profile?.status === 'normal' ? '正常' : '冻结'}</Tag>
            </div>
          </div>
          <div className="flex gap-8">
            <Statistic 
              title="账户余额" 
              value={profile?.balance || 0} 
              prefix="¥" 
              precision={2}
            />
            <Statistic 
              title="会员积分" 
              value={profile?.score || 0} 
            />
          </div>
        </div>
      </Card>

      {/* 快捷入口 */}
      <Title level={5} className="mb-4">快捷功能</Title>
      <Row gutter={[16, 16]} className="mb-6">
        {quickActions.map((action, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card 
              hoverable 
              className={`${action.color} cursor-pointer`}
              onClick={() => navigate(action.path)}
            >
              <div className="flex items-center gap-4">
                {action.icon}
                <div className="flex-1">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-gray-500">{action.desc}</div>
                </div>
                <ArrowRightOutlined />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 最近记录 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="最近余额变动" 
            extra={<Button type="link" onClick={() => navigate('/member/records/balance')}>查看全部</Button>}
          >
            <List
              dataSource={recentBalanceRecords}
              renderItem={(record) => (
                <List.Item>
                  <div className="flex justify-between w-full">
                    <div>
                      <div>{record.remark || '余额变动'}</div>
                      <div className="text-sm text-gray-400">
                        {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}
                      </div>
                    </div>
                    <div className={record.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                      {record.amount > 0 ? '+' : ''}{record.amount}
                    </div>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: '暂无记录' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title="最近积分变动" 
            extra={<Button type="link" onClick={() => navigate('/member/records/score')}>查看全部</Button>}
          >
            <List
              dataSource={recentScoreRecords}
              renderItem={(record) => (
                <List.Item>
                  <div className="flex justify-between w-full">
                    <div>
                      <div>{record.remark || '积分变动'}</div>
                      <div className="text-sm text-gray-400">
                        {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}
                      </div>
                    </div>
                    <div className={record.score > 0 ? 'text-green-500' : 'text-red-500'}>
                      {record.score > 0 ? '+' : ''}{record.score}
                    </div>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: '暂无记录' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
