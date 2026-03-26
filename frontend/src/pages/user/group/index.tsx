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
import { userGroupService } from '../../../services/user-group.service';
import type { QueryUserGroupDTO, CreateUserGroupDTO, UpdateUserGroupDTO, UserGroupItem } from '../../../services/user-group.service';
import { usePermissionStore } from '../../../store/permission.store';
import request from '../../../services/request';

export default function UserGroupManagement() {
  const [data, setData] = useState<UserGroupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroupItem | null>(null);
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
  const [searchParams, setSearchParams] = useState<QueryUserGroupDTO>({});
  const { hasPermission } = usePermissionStore();

  const canCreate = hasPermission('user:group:create');
  const canEdit = hasPermission('user:group:edit');
  const canDelete = hasPermission('user:group:delete');

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
      const response = await userGroupService.getList(params);
      if (response.data) {
        setData(response.data.list);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
        }));
      }
    } catch (error) {
      message.error('获取用户组列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: QueryUserGroupDTO) => {
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

  const handleEdit = (record: UserGroupItem) => {
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
      await userGroupService.delete(id);
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
        const updateData: UpdateUserGroupDTO = {
          name: values.name,
          description: values.description,
          status: values.status,
        };
        await userGroupService.update(editingGroup.id, updateData);
        message.success('更新成功');
      } else {
        const createData: CreateUserGroupDTO = {
          name: values.name,
          description: values.description,
          status: values.status || 'normal',
        };
        await userGroupService.create(createData);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchGroups();
    } catch (error: any) {
      message.error(error?.message || '操作失败');
    }
  };

  const handlePermissionSetting = async (record: UserGroupItem) => {
    setCurrentGroupId(record.id);
    setPermissionDrawerVisible(true);
    try {
      const permResponse = await request.get<any>('/api/admin/permissions/tree');
      setAllPermissions(permResponse.data || []);

      const groupPermResponse = await userGroupService.getPermissions(record.id);
      setCheckedPermissionIds(groupPermResponse.data?.permission_ids || []);
    } catch (error) {
      message.error('获取权限数据失败');
    }
  };

  const handlePermissionSave = async () => {
    if (!currentGroupId) return;
    try {
      await userGroupService.assignPermissions(currentGroupId, checkedPermissionIds);
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
      title: '用户数量',
      dataIndex: 'user_count',
      key: 'user_count',
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
      render: (_: any, record: UserGroupItem) => (
        <Space size="small">
          {canEdit && (
            <Button type="link" size="small" onClick={() => handlePermissionSetting(record)}>
              权限设置
            </Button>
          )}
          {canEdit && (
            <Button type="link" size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {canDelete && record.id !== 1 && (
            <Popconfirm
              title="确定删除此用户组？"
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
            新增用户组
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
        title={editingGroup ? '编辑用户组' : '新增用户组'}
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
