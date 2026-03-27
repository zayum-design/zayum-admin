import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { testService } from '../../services/test.service';
import type { SysTestItem, CreateSysTestDto, UpdateSysTestDto } from '../../services/test.service';

export default function SysTestManagement() {
  const [data, setData] = useState<SysTestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<SysTestItem | null>(null);
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
      const response = await testService.getList({
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

  const handleEdit = (record: SysTestItem) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await testService.delete(id);
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
        await testService.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await testService.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error?.message || '操作失败');
    }
  };

  const columns: ColumnsType<SysTestItem> = [
    {
      title: 'name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'keu',
      dataIndex: 'keu',
      key: 'keu',
    },
    {
      title: 'stadsaf',
      dataIndex: 'stadsaf',
      key: 'stadsaf',
    },
    {
      title: 'fasd',
      dataIndex: 'fasd',
      key: 'fasd',
    },
    {
      title: 'afds',
      dataIndex: 'afds',
      key: 'afds',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SysTestItem) => (
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
        <Form.Item name="name" label="name">
          <Input />
        </Form.Item>
        <Form.Item name="keu" label="keu">
          <Input />
        </Form.Item>
        <Form.Item name="stadsaf" label="stadsaf">
          <Input />
        </Form.Item>
        <Form.Item name="fasd" label="fasd">
          <Input />
        </Form.Item>
        <Form.Item name="afds" label="afds">
          <Input />
        </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}