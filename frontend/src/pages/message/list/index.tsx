import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  message,
  Tag,
  Tabs,
  Drawer,
  Popconfirm,
} from 'antd';
import {
  DeleteOutlined,
  CheckOutlined,
  BellOutlined,
  MailOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { notificationService, type QueryNotificationDto } from '../../../services/notification.service';
import type { SysNotification } from '../../../types/entities';

const { TabPane } = Tabs;

export default function NotificationList() {
  const [data, setData] = useState<SysNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [query, setQuery] = useState<QueryNotificationDto>({
    page: 1,
    pageSize: 10,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<SysNotification | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { ...query };
      if (activeTab === 'unread') {
        params.isRead = 'false';
      } else if (activeTab === 'read') {
        params.isRead = 'true';
      }
      const result = await notificationService.list(params);
      setData(result.data.list);
      setUnreadCount(result.data.unreadCount);
      setPagination({
        current: result.data.pagination.page,
        pageSize: result.data.pagination.pageSize,
        total: result.data.pagination.total,
      });
    } catch (error) {
      message.error('获取通知列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [query, activeTab]);

  const handleTableChange = (pag: any) => {
    setQuery((prev) => ({
      ...prev,
      page: pag.current,
      pageSize: pag.pageSize,
    }));
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setQuery((prev) => ({ ...prev, page: 1 }));
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      message.success('已标记为已读');
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationService.remove(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await notificationService.batchRemove(selectedRowKeys as number[]);
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      fetchData();
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.batchMarkAsRead();
      message.success('全部标记已读成功');
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const showDetail = (record: SysNotification) => {
    setCurrentNotification(record);
    setDetailVisible(true);
    if (!record.isRead) {
      handleMarkAsRead(record.id);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <BellOutlined style={{ color: '#1890ff' }} />;
      case 'message':
        return <MessageOutlined style={{ color: '#52c41a' }} />;
      case 'email':
        return <MailOutlined style={{ color: '#722ed1' }} />;
      default:
        return <BellOutlined />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'system':
        return '系统通知';
      case 'message':
        return '消息';
      case 'email':
        return '邮件';
      default:
        return type;
    }
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return time;
  };

  const columns: ColumnsType<SysNotification> = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Space>
          {getTypeIcon(type)}
          <span>{getTypeName(type)}</span>
        </Space>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record) => (
        <Space>
          {!record.isRead && <span style={{ color: '#ff4d4f' }}>●</span>}
          <span style={{ fontWeight: record.isRead ? 'normal' : 'bold' }}>{title}</span>
        </Space>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (time: string) => formatTime(time),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => showDetail(record)}>
            查看
          </Button>
          {!record.isRead && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handleMarkAsRead(record.id)}
            >
              已读
            </Button>
          )}
          <Popconfirm
            title="确认删除"
            description="确定要删除这条通知吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div style={{ padding: 24 }}>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        tabBarExtraContent={
          <Space>
            <Button icon={<CheckOutlined />} onClick={handleMarkAllAsRead}>
              全部标记已读
            </Button>
            <Popconfirm
              title="确认批量删除"
              description={`将删除选中的 ${selectedRowKeys.length} 条通知`}
              onConfirm={handleBatchDelete}
              okText="确认"
              cancelText="取消"
              disabled={selectedRowKeys.length === 0}
            >
              <Button danger icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0}>
                批量删除
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        <TabPane tab={`全部 ${pagination.total}`} key="all" />
        <TabPane tab={`未读 ${unreadCount}`} key="unread" />
        <TabPane tab="已读" key="read" />
      </Tabs>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        rowSelection={rowSelection}
        onChange={handleTableChange}
      />

      <Drawer
        title="通知详情"
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={500}
      >
        {currentNotification && (
          <div>
            <h3>{currentNotification.title}</h3>
            <Space style={{ marginBottom: 16 }}>
              <Tag color="blue">{getTypeName(currentNotification.type)}</Tag>
              <span style={{ color: '#999' }}>{currentNotification.createdAt}</span>
            </Space>
            <div style={{ lineHeight: 1.8 }}>{currentNotification.content}</div>
            {currentNotification.link && (
              <div style={{ marginTop: 16 }}>
                <a href={currentNotification.link} target="_blank" rel="noopener noreferrer">
                  查看详情
                </a>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
