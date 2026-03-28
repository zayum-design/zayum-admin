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
import type { QueryOperationLogDTO, OperationLogItem } from '../../../services/log.service';
import { usePermissionStore } from '../../../store/permission.store';

export default function OperationLog() {
  const [data, setData] = useState<OperationLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<OperationLogItem | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState<QueryOperationLogDTO>({});
  const { hasPermission } = usePermissionStore();

  const canView = hasPermission('log:operation:view');

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
      const response = await logService.getOperationLogList(params);
      if (response.data) {
        setData(response.data.list as OperationLogItem[]);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
        }));
      }
    } catch (error) {
      message.error('获取操作日志失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: QueryOperationLogDTO) => {
    setSearchParams(values);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setSearchParams({});
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleViewDetail = (record: OperationLogItem) => {
    setCurrentLog(record);
    setDetailVisible(true);
  };

  const methodColors: Record<string, string> = {
    GET: 'green',
    POST: 'blue',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple',
  };

  const columns: ColumnsType<OperationLogItem> = [
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
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
    },
    {
      title: '动作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => <Tag color={methodColors[method]}>{method}</Tag>,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
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
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration?: number) => (duration ? `${duration}ms` : '-'),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: OperationLogItem) => (
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
          <Form.Item name="module" label="模块">
            <Input placeholder="模块" allowClear style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="method" label="方法">
            <Select placeholder="方法" allowClear style={{ width: 80 }}>
              <Select.Option value="GET">GET</Select.Option>
              <Select.Option value="POST">POST</Select.Option>
              <Select.Option value="PUT">PUT</Select.Option>
              <Select.Option value="DELETE">DELETE</Select.Option>
            </Select>
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
        title="操作日志详情"
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={600}
      >
        {currentLog && (
          <div>
            <p><strong>用户类型：</strong>{currentLog.userType === 'admin' ? '管理员' : '用户'}</p>
            <p><strong>用户ID：</strong>{currentLog.userId}</p>
            <p><strong>用户名：</strong>{currentLog.username}</p>
            <p><strong>模块：</strong>{currentLog.module}</p>
            <p><strong>动作：</strong>{currentLog.action}</p>
            <p><strong>请求方法：</strong>{currentLog.method}</p>
            <p><strong>请求URL：</strong>{currentLog.url}</p>
            <p><strong>请求参数：</strong></p>
            <pre style={{ background: '#f5f5f5', padding: 10, overflow: 'auto' }}>
              {currentLog.params ? JSON.stringify(JSON.parse(currentLog.params), null, 2) : '-'}
            </pre>
            <p><strong>IP地址：</strong>{currentLog.ip}</p>
            <p><strong>User-Agent：</strong>{currentLog.userAgent || '-'}</p>
            <p><strong>状态：</strong>{currentLog.status === 'success' ? '成功' : '失败'}</p>
            {currentLog.errorMsg && <p><strong>错误信息：</strong>{currentLog.errorMsg}</p>}
            {currentLog.duration && <p><strong>执行时长：</strong>{currentLog.duration}ms</p>}
            <p><strong>操作时间：</strong>{currentLog.createdAt}</p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
