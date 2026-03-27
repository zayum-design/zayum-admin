import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Form, Input, Select, DatePicker, Card, Modal, message } from 'antd';
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { UserBalanceService } from '../../services/user-balance.service';
import type { UserBalanceItem, QueryUserBalanceDto } from '../../services/user-balance.service';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const UserBalancePage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserBalanceItem[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const fetchData = async (params: QueryUserBalanceDto = {}) => {
    setLoading(true);
    try {
      const result = await UserBalanceService.findAll({
        ...params,
        page: pagination.current,
        page_size: pagination.pageSize,
      });
      setData(result.list);
      setPagination({
        ...pagination,
        total: result.total,
      });
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const handleSearch = (values: any) => {
    const params: QueryUserBalanceDto = {};
    if (values.user_id) params.user_id = values.user_id;
    if (values.admin_id) params.admin_id = values.admin_id;
    if (values.scene) params.scene = values.scene;
    if (values.order_no) params.order_no = values.order_no;
    if (values.timeRange && values.timeRange.length === 2) {
      params.start_time = values.timeRange[0].format('YYYY-MM-DD');
      params.end_time = values.timeRange[1].format('YYYY-MM-DD');
    }
    fetchData(params);
  };

  const handleReset = () => {
    form.resetFields();
    fetchData();
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: async () => {
        try {
          await UserBalanceService.remove(id);
          message.success('删除成功');
          fetchData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的记录');
      return;
    }
    Modal.confirm({
      title: '批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`,
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map(id => UserBalanceService.remove(id as number)));
          message.success('批量删除成功');
          setSelectedRowKeys([]);
          fetchData();
        } catch (error) {
          message.error('批量删除失败');
        }
      },
    });
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户ID', dataIndex: 'user_id', width: 100 },
    { title: '管理员ID', dataIndex: 'admin_id', width: 100 },
    { title: '场景', dataIndex: 'scene', width: 120 },
    { 
      title: '变更余额', 
      dataIndex: 'change_balance', 
      width: 120,
      render: (value: number) => (
        <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {value >= 0 ? '+' : ''}{value}
        </span>
      )
    },
    { title: '变更前', dataIndex: 'before_balance', width: 120 },
    { title: '变更后', dataIndex: 'after_balance', width: 120 },
    { title: '订单号', dataIndex: 'order_no', width: 150 },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    { 
      title: '创建时间', 
      dataIndex: 'created_at', 
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      width: 120,
      render: (_: any, record: UserBalanceItem) => (
        <Space size="small">
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <Card>
      <Form form={form} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
        <Form.Item name="user_id" label="用户ID">
          <Input placeholder="请输入用户ID" style={{ width: 120 }} />
        </Form.Item>
        <Form.Item name="admin_id" label="管理员ID">
          <Input placeholder="请输入管理员ID" style={{ width: 120 }} />
        </Form.Item>
        <Form.Item name="scene" label="场景">
          <Select placeholder="请选择场景" style={{ width: 140 }} allowClear>
            <Option value="recharge">充值</Option>
            <Option value="consume">消费</Option>
            <Option value="refund">退款</Option>
            <Option value="admin_recharge">管理员充值</Option>
            <Option value="admin_deduct">管理员扣除</Option>
            <Option value="admin_update">管理员修改</Option>
          </Select>
        </Form.Item>
        <Form.Item name="order_no" label="订单号">
          <Input placeholder="请输入订单号" style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="timeRange" label="时间范围">
          <RangePicker style={{ width: 240 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
            <Button danger onClick={handleBatchDelete} disabled={selectedRowKeys.length === 0}>
              批量删除
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => {
            setPagination({ ...pagination, current: page, pageSize });
          },
        }}
        rowSelection={rowSelection}
        scroll={{ x: 1500 }}
      />
    </Card>
  );
};

export default UserBalancePage;
