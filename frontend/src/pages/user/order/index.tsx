import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { userOrderService } from '../../../services/user-order.service';
import type { SysUserOrderItem, CreateSysUserOrderDto, UpdateSysUserOrderDto } from '../../../services/user-order.service';

export default function SysUserOrderManagement() {
  const [data, setData] = useState<SysUserOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<SysUserOrderItem | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await userOrderService.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      if (response.data) {
        setData(response.data.list);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
        }));
      }
    } catch (error) {
      message.error('获取列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: SysUserOrderItem) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await userOrderService.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await userOrderService.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await userOrderService.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error?.message || '操作失败');
    }
  };

  const columns: ColumnsType<SysUserOrderItem> = [
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
    },
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
    },
    {
      title: '订单类型',
      dataIndex: 'order_type',
      key: 'order_type',
    },
    {
      title: '订单金额',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: '支付金额',
      dataIndex: 'pay_amount',
      key: 'pay_amount',
    },
    {
      title: '货币',
      dataIndex: 'currency',
      key: 'currency',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '支付方式',
      dataIndex: 'pay_method',
      key: 'pay_method',
    },
    {
      title: '支付交易号',
      dataIndex: 'pay_trade_no',
      key: 'pay_trade_no',
    },
    {
      title: '支付数据',
      dataIndex: 'pay_data',
      key: 'pay_data',
    },
    {
      title: '快照',
      dataIndex: 'snapshot',
      key: 'snapshot',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '额外数据',
      dataIndex: 'extra_data',
      key: 'extra_data',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: '用户代理',
      dataIndex: 'user_agent',
      key: 'user_agent',
    },
    {
      title: '支付时间',
      dataIndex: 'paid_at',
      key: 'paid_at',
    },
    {
      title: '取消时间',
      dataIndex: 'cancelled_at',
      key: 'cancelled_at',
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
    },
    {
      title: '过期时间',
      dataIndex: 'expired_at',
      key: 'expired_at',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SysUserOrderItem) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <Button type="primary" onClick={handleCreate}>
          新增
        </Button>
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
            setPagination({ current: page, pageSize: pageSize || 10, total: pagination.total });
          },
        }}
      />

      <Modal
        title={editingItem ? '编辑' : '新增'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
        <Form.Item name="user_id" label="用户ID">
          <Input />
        </Form.Item>
        <Form.Item name="order_no" label="订单号">
          <Input />
        </Form.Item>
        <Form.Item name="order_type" label="订单类型">
          <Input />
        </Form.Item>
        <Form.Item name="amount" label="订单金额">
          <Input />
        </Form.Item>
        <Form.Item name="pay_amount" label="支付金额">
          <Input />
        </Form.Item>
        <Form.Item name="currency" label="货币">
          <Input />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Input />
        </Form.Item>
        <Form.Item name="pay_method" label="支付方式">
          <Input />
        </Form.Item>
        <Form.Item name="pay_trade_no" label="支付交易号">
          <Input />
        </Form.Item>
        <Form.Item name="pay_data" label="支付数据">
          <Input />
        </Form.Item>
        <Form.Item name="snapshot" label="快照">
          <Input />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input />
        </Form.Item>
        <Form.Item name="extra_data" label="额外数据">
          <Input />
        </Form.Item>
        <Form.Item name="ip" label="IP地址">
          <Input />
        </Form.Item>
        <Form.Item name="user_agent" label="用户代理">
          <Input />
        </Form.Item>
        <Form.Item name="paid_at" label="支付时间">
          <Input />
        </Form.Item>
        <Form.Item name="cancelled_at" label="取消时间">
          <Input />
        </Form.Item>
        <Form.Item name="completed_at" label="完成时间">
          <Input />
        </Form.Item>
        <Form.Item name="expired_at" label="过期时间">
          <Input />
        </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}