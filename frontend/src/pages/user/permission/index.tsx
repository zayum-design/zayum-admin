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
import { userPermissionService } from '../../../services/user-permission.service';
import type {
  SysUserPermissionItem, 
} from '../../../services/user-permission.service';

export default function SysUserPermissionManagement() {
  const [data, setData] = useState<SysUserPermissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<SysUserPermissionItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await userPermissionService.getTree();
      setData(response.data || []);
    } catch (error) {
      message.error('获取权限列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: SysUserPermissionItem) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      parent_id: record.parent_id || 0,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await userPermissionService.delete(id);
      message.success('删除成功');
      fetchPermissions();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await userPermissionService.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await userPermissionService.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchPermissions();
    } catch (error: any) {
      message.error(error?.message || '操作失败');
    }
  };

  const convertToTreeData = (permissions: SysUserPermissionItem[]): DataNode[] => {
    return permissions.map((p) => ({
      key: p.id,
      title: `${p.name} (${p.code})`,
      children: p.children ? convertToTreeData(p.children) : undefined,
    }));
  };

  // 移除 flattenPermissions 函数，直接使用树形数据

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
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SysUserPermissionItem) => (
        <>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除此权限？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <Button type="primary" onClick={handleCreate}>
          新增权限
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={false}
        expandable={{
          childrenColumnName: 'children',
          defaultExpandAllRows: true,
        }}
      />

      <Modal
        title={editingItem ? '编辑权限' : '新增权限'}
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
            <Input placeholder="如: user:permission:create" disabled={!!editingItem} />
          </Form.Item>
          <Form.Item name="type" label="权限类型" initialValue="menu">
            <Select>
              <Select.Option value="menu">菜单</Select.Option>
              <Select.Option value="button">按钮</Select.Option>
              <Select.Option value="api">接口</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="path" label="路由路径">
            <Input placeholder="如: /user/permission" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="如: UserOutlined" />
          </Form.Item>
          <Form.Item name="component" label="组件路径">
            <Input placeholder="如: /user/permission/index" />
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
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
