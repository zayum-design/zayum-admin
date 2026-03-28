import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Space,
  Tag,
  Drawer,
  Tree,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import { SettingOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminGroupService } from '../../../services/admin-group.service';
import type { QueryAdminGroupDTO, CreateAdminGroupDTO, UpdateAdminGroupDTO, AdminGroupItem } from '../../../services/admin-group.service';
import { usePermissionStore } from '../../../store/permission.store';
import request from '../../../services/request';

export default function AdminGroupManagement() {
  const [data, setData] = useState<AdminGroupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AdminGroupItem | null>(null);
  const [permissionDrawerVisible, setPermissionDrawerVisible] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<number | null>(null);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [checkedPermissionIds, setCheckedPermissionIds] = useState<number[]>([]);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState<QueryAdminGroupDTO>({});
  const { hasPermission } = usePermissionStore();

  const canCreate = hasPermission('system:admin-group:create');
  const canEdit = hasPermission('system:admin-group:edit');
  const canDelete = hasPermission('system:admin-group:delete');

  useEffect(() => {
    fetchGroups();
  }, [pagination.current, pagination.pageSize, searchParams]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params = {
        ...searchParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      const response = await adminGroupService.getList(params);
      if (response.data) {
        setData(response.data.list);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
        }));
      }
    } catch (error) {
      message.error('获取管理员组列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: QueryAdminGroupDTO) => {
    setSearchParams(values);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setSearchParams({});
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleCreate = () => {
    setEditingGroup(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: AdminGroupItem) => {
    setEditingGroup(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await adminGroupService.delete(id);
      message.success('删除成功');
      fetchGroups();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingGroup) {
        const updateData: UpdateAdminGroupDTO = {
          name: values.name,
          description: values.description,
          status: values.status,
        };
        await adminGroupService.update(editingGroup.id, updateData);
        message.success('更新成功');
      } else {
        const createData: CreateAdminGroupDTO = {
          name: values.name,
          description: values.description,
          status: values.status || 'normal',
        };
        await adminGroupService.create(createData);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchGroups();
    } catch (error: any) {
      message.error(error?.message || '操作失败');
    }
  };

  const handlePermissionSetting = async (record: AdminGroupItem) => {
    setCurrentGroupId(record.id);
    setPermissionDrawerVisible(true);
    // 获取所有权限树
    try {
      const permResponse = await request.get<any>('/api/admin/permissions/tree');
      setAllPermissions(permResponse.data || []);

      // 获取当前组的权限
      const groupPermResponse = await adminGroupService.getPermissions(record.id);
      setCheckedPermissionIds(groupPermResponse.data?.permission_ids || []);
    } catch (error) {
      message.error('获取权限数据失败');
    }
  };

  const handlePermissionSave = async () => {
    if (!currentGroupId) return;
    try {
      await adminGroupService.assignPermissions(currentGroupId, checkedPermissionIds);
      message.success('权限分配成功');
      setPermissionDrawerVisible(false);
    } catch (error: any) {
      message.error(error?.message || '权限分配失败');
    }
  };

  const convertToTreeData = (permissions: any[]): DataNode[] => {
    return permissions.map((p) => ({
      key: p.id,
      title: `${p.name} (${p.code})`,
      children: p.children ? convertToTreeData(p.children) : undefined,
    }));
  };

  const onCheck = (checkedKeys: any) => {
    setCheckedPermissionIds(checkedKeys);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '组名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '管理员数量',
      dataIndex: 'admin_count',
      key: 'admin_count',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'normal' ? 'green' : 'red'}>
          {status === 'normal' ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: AdminGroupItem) => (
        <Space size="small">
          {canEdit && (
            <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => handlePermissionSetting(record)}>
              权限设置
            </Button>
          )}
          {canEdit && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {canDelete && record.id !== 1 && (
            <Popconfirm
              title="确定删除此管理员组？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" size="small" icon={<DeleteOutlined />} danger>
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
          <Form.Item name="name" label="组名">
            <Input placeholder="组名" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="状态" allowClear style={{ width: 120 }}>
              <Select.Option value="normal">正常</Select.Option>
              <Select.Option value="hidden">禁用</Select.Option>
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
            新增管理员组
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
        title={editingGroup ? '编辑管理员组' : '新增管理员组'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="组名"
            rules={[{ required: true, message: '请输入组名' }, { max: 50, message: '组名最多50个字符' }]}
          >
            <Input placeholder="请输入组名" disabled={editingGroup?.id === 1} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" rows={3} maxLength={200} showCount />
          </Form.Item>
          {editingGroup && (
            <Form.Item name="status" label="状态" initialValue="normal">
              <Select disabled={editingGroup?.id === 1}>
                <Select.Option value="normal">正常</Select.Option>
                <Select.Option value="hidden">禁用</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Drawer
        title="权限设置"
        open={permissionDrawerVisible}
        onClose={() => setPermissionDrawerVisible(false)}
        width={500}
        extra={
          <Button type="primary" onClick={handlePermissionSave}>
            保存
          </Button>
        }
      >
        <Tree
          checkable
          treeData={convertToTreeData(allPermissions)}
          checkedKeys={checkedPermissionIds}
          onCheck={(keys) => onCheck(keys)}
          showLine
        />
      </Drawer>
    </div>
  );
}
