import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tree,
  message,
  Popconfirm,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import request from '../../../services/request';
import { usePermissionStore } from '../../../store/permission.store';

interface Permission {
  id: number;
  parent_id: number;
  name: string;
  code: string;
  type: 'menu' | 'button' | 'api';
  path?: string;
  icon?: string;
  component?: string;
  sort: number;
  status: string;
  children?: Permission[];
}

export default function PermissionManagement() {
  const [data, setData] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [form] = Form.useForm();
  const { hasPermission } = usePermissionStore();

  const canCreate = hasPermission('system:permission:create');
  const canEdit = hasPermission('system:permission:edit');
  const canDelete = hasPermission('system:permission:delete');

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await request.get<any>('/api/admin/permissions/tree');
      setData(response.data || []);
    } catch (error) {
      message.error('获取权限列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPermission(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Permission) => {
    setEditingPermission(record);
    form.setFieldsValue({
      ...record,
      parent_id: record.parent_id || 0,
    });
    setModalVisible(true);
  };

  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const parentId = Number(selectedKeys[0]);
      form.setFieldsValue({ parent_id: parentId });
    } else {
      form.setFieldsValue({ parent_id: 0 });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/api/admin/permissions/${id}`);
      message.success('删除成功');
      fetchPermissions();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingPermission) {
        // 编辑时移除 code 字段，因为 UpdatePermissionDto 中没有 code 字段
        const { code, ...updateValues } = values;
        await request.put(`/api/admin/permissions/${editingPermission.id}`, updateValues);
        message.success('更新成功');
      } else {
        await request.post('/api/admin/permissions', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchPermissions();
    } catch (error: any) {
      message.error(error?.message || '操作失败');
    }
  };

  const convertToTreeData = (permissions: Permission[]): DataNode[] => {
    return permissions.map((p) => ({
      key: p.id,
      title: `${p.name} (${p.code})`,
      children: p.children ? convertToTreeData(p.children) : undefined,
    }));
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const map: Record<string, string> = {
          menu: '菜单',
          button: '按钮',
          api: '接口',
        };
        return map[type] || type;
      },
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (status === 'normal' ? '正常' : '禁用'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Permission) => (
        <>
          {canEdit && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title="确定删除此权限？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" size="small" icon={<DeleteOutlined />} danger>
                删除
              </Button>
            </Popconfirm>
          )}
        </>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        {canCreate && (
          <Button type="primary" onClick={handleCreate}>
            新增权限
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingPermission ? '编辑权限' : '新增权限'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="parent_id" label="父权限">
            <Tree
              treeData={convertToTreeData(data)}
              showLine
              onSelect={handleTreeSelect}
              selectedKeys={form.getFieldValue('parent_id') ? [form.getFieldValue('parent_id').toString()] : []}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="权限名称"
            rules={[{ required: true, message: '请输入权限名称' }]}
          >
            <Input placeholder="请输入权限名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="权限代码"
            rules={[{ required: true, message: '请输入权限代码' }]}
          >
            <Input placeholder="如: system:user:create" disabled={!!editingPermission} />
          </Form.Item>
          <Form.Item name="type" label="权限类型" initialValue="menu">
            <Select>
              <Select.Option value="menu">菜单</Select.Option>
              <Select.Option value="button">按钮</Select.Option>
              <Select.Option value="api">接口</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="path" label="路由路径">
            <Input placeholder="如: /system/user" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="如: UserOutlined" />
          </Form.Item>
          <Form.Item name="component" label="组件路径">
            <Input placeholder="如: /system/user/index" />
          </Form.Item>
          <Form.Item name="sort" label="排序" initialValue={0}>
            <Input type="number" placeholder="数值越小越靠前" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="normal">
            <Select>
              <Select.Option value="normal">正常</Select.Option>
              <Select.Option value="hidden">禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
