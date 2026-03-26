import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  message,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { configService } from '../../../services/config.service';
import type { QueryConfigDTO, CreateConfigDTO, UpdateConfigDTO, ConfigItem } from '../../../services/config.service';
import { usePermissionStore } from '../../../store/permission.store';

export default function ConfigManagement() {
  const [data, setData] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigItem | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState<QueryConfigDTO>({});
  const { hasPermission } = usePermissionStore();

  const canCreate = hasPermission('system:config:create');
  const canEdit = hasPermission('system:config:edit');
  const canDelete = hasPermission('system:config:delete');

  useEffect(() => {
    fetchConfigs();
  }, [pagination.current, pagination.pageSize, searchParams]);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const params = {
        ...searchParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      const response = await configService.getList(params);
      if (response.data) {
        setData(response.data.list);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
        }));
      }
    } catch (error) {
      message.error('获取配置列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: QueryConfigDTO) => {
    setSearchParams(values);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setSearchParams({});
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleCreate = () => {
    setEditingConfig(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: ConfigItem) => {
    setEditingConfig(record);
    form.setFieldsValue({
      category: record.category,
      key: record.configKey,
      value: record.configValue,
      description: record.description,
      type: record.type,
      is_public: record.isPublic,
      sort: record.sort,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await configService.delete(id);
      message.success('删除成功');
      fetchConfigs();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingConfig) {
        const updateData: UpdateConfigDTO = {
          value: values.value,
          description: values.description,
          type: values.type,
          is_public: values.is_public,
          sort: values.sort,
        };
        await configService.update(editingConfig.id, updateData);
        message.success('更新成功');
      } else {
        const createData: CreateConfigDTO = {
          category: values.category,
          key: values.key,
          value: values.value,
          description: values.description,
          type: values.type,
          is_public: values.is_public,
          sort: values.sort,
        };
        await configService.create(createData);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchConfigs();
    } catch (error: any) {
      message.error(error?.message || '操作失败');
    }
  };

  const typeColors: Record<string, string> = {
    string: 'default',
    number: 'blue',
    boolean: 'green',
    json: 'orange',
  };

  const columns: ColumnsType<ConfigItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '配置键',
      dataIndex: 'configKey',
      key: 'configKey',
      width: 150,
    },
    {
      title: '配置值',
      dataIndex: 'configValue',
      key: 'configValue',
      width: 200,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => <Tag color={typeColors[type]}>{type}</Tag>,
    },
    {
      title: '公开',
      dataIndex: 'isPublic',
      key: 'isPublic',
      width: 60,
      render: (isPublic: boolean) => (isPublic ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag>),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 60,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ConfigItem) => (
        <Space size="small">
          {canEdit && (
            <Button type="link" size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title="确定删除此配置？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="category" label="分类">
            <Input placeholder="分类" allowClear style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="key" label="配置键">
            <Input placeholder="配置键" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="is_public" label="公开">
            <Select placeholder="是否公开" allowClear style={{ width: 100 }}>
              <Select.Option value="true">是</Select.Option>
              <Select.Option value="false">否</Select.Option>
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

      <div className="mb-4">
        {canCreate && (
          <Button type="primary" onClick={handleCreate}>
            新增配置
          </Button>
        )}
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

      <Modal
        title={editingConfig ? '编辑配置' : '新增配置'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          {!editingConfig && (
            <>
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请输入分类' }]}
              >
                <Input placeholder="如: system, email, upload" />
              </Form.Item>
              <Form.Item
                name="key"
                label="配置键"
                rules={[{ required: true, message: '请输入配置键' }]}
              >
                <Input placeholder="如: site_name" disabled={!!editingConfig} />
              </Form.Item>
            </>
          )}
          <Form.Item
            name="value"
            label="配置值"
            rules={[{ required: true, message: '请输入配置值' }]}
          >
            <Input.TextArea placeholder="请输入配置值" rows={3} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" rows={2} />
          </Form.Item>
          <Form.Item name="type" label="类型" initialValue="string">
            <Select>
              <Select.Option value="string">字符串</Select.Option>
              <Select.Option value="number">数字</Select.Option>
              <Select.Option value="boolean">布尔值</Select.Option>
              <Select.Option value="json">JSON</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="is_public" label="是否公开" initialValue={false}>
            <Select>
              <Select.Option value={true}>是</Select.Option>
              <Select.Option value={false}>否</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="sort" label="排序" initialValue={0}>
            <Input type="number" placeholder="数值越小越靠前" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
