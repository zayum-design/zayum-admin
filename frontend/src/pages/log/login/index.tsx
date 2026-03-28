import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Drawer,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined } from '@ant-design/icons';
import { logService } from '../../../services/log.service';
import type { QueryLoginLogDTO, LoginLogItem } from '../../../services/log.service';
import { usePermissionStore } from '../../../store/permission.store';

export default function LoginLog() {
  const [data, setData] = useState<LoginLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<LoginLogItem | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState<QueryLoginLogDTO>({});
  const { hasPermission } = usePermissionStore();

  const canView = hasPermission('log:login:view');

  useEffect(() => {
    if (canView) {
      fetchLogs();
    }
  }, [pagination.current, pagination.pageSize, searchParams]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        ...searchParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      const response = await logService.getLoginLogList(params);
      if (response.data) {
        setData(response.data.list);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
        }));
      }
    } catch (error) {
      message.error('获取登录日志失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: QueryLoginLogDTO) => {
    setSearchParams(values);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setSearchParams({});
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleViewDetail = (record: LoginLogItem) => {
    setCurrentLog(record);
    setDetailVisible(true);
  };

  const columns: ColumnsType<LoginLogItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '用户类型',
      dataIndex: 'userType',
      key: 'userType',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'admin' ? 'blue' : 'green'}>{type === 'admin' ? '管理员' : '用户'}</Tag>
      ),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 100,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
    },
    {
      title: '登录地点',
      dataIndex: 'location',
      key: 'location',
      width: 150,
    },
    {
      title: '浏览器',
      dataIndex: 'browser',
      key: 'browser',
      width: 120,
    },
    {
      title: '操作系统',
      dataIndex: 'os',
      key: 'os',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>{status === 'success' ? '成功' : '失败'}</Tag>
      ),
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      width: 150,
      ellipsis: true,
    },
    {
      title: '登录时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: LoginLogItem) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="user_type" label="用户类型">
            <Select placeholder="用户类型" allowClear style={{ width: 100 }}>
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="user">用户</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="username" label="用户名">
            <Input placeholder="用户名" allowClear style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="ip" label="IP地址">
            <Input placeholder="IP地址" allowClear style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="状态" allowClear style={{ width: 80 }}>
              <Select.Option value="success">成功</Select.Option>
              <Select.Option value="failure">失败</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

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
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize, total: pagination.total });
          },
        }}
      />

      <Drawer
        title="登录日志详情"
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={500}
      >
        {currentLog && (
          <div>
            <p><strong>用户类型：</strong>{currentLog.userType === 'admin' ? '管理员' : '用户'}</p>
            <p><strong>用户ID：</strong>{currentLog.userId}</p>
            <p><strong>用户名：</strong>{currentLog.username}</p>
            <p><strong>IP地址：</strong>{currentLog.ip}</p>
            <p><strong>登录地点：</strong>{currentLog.location || '-'}</p>
            <p><strong>浏览器：</strong>{currentLog.browser || '-'}</p>
            <p><strong>操作系统：</strong>{currentLog.os || '-'}</p>
            <p><strong>状态：</strong>{currentLog.status === 'success' ? '成功' : '失败'}</p>
            <p><strong>消息：</strong>{currentLog.message || '-'}</p>
            <p><strong>登录时间：</strong>{currentLog.createdAt}</p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
