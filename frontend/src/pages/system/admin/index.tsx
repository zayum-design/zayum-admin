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
} from 'antd';
import { adminService } from '../../../services/admin.service';
import type { QueryAdminDTO, CreateAdminDTO, UpdateAdminDTO, AdminItem } from '../../../services/admin.service';
import { usePermissionStore } from '../../../store/permission.store';

export default function AdminManagement() {
  const [data, setData] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminItem | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState<QueryAdminDTO>({});
  const { hasPermission } = usePermissionStore();

  const canCreate = hasPermission('system:admin:create');
  const canEdit = hasPermission('system:admin:edit');
  const canDelete = hasPermission('system:admin:delete');
  const canResetPassword = hasPermission('system:admin:reset-password');

  useEffect(() => {
    fetchAdmins();
  }, [pagination.current, pagination.pageSize, searchParams]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params = {
        ...searchParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      const response = await adminService.getList(params);
      if (response.data) {
        setData(response.data.list);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
        }));
      }
    } catch (error) {
      message.error('获取管理员列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: QueryAdminDTO) => {
    setSearchParams(values);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setSearchParams({});
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleCreate = () => {
    setEditingAdmin(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: AdminItem) => {
    setEditingAdmin(record);
    form.setFieldsValue({
      nickname: record.nickname,
      email: record.email,
      mobile: record.mobile,
      group_id: record.group_id,
      avatar: record.avatar,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await adminService.delete(id);
      message.success('删除成功');
      fetchAdmins();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await adminService.updateStatus(id, status);
      message.success('状态更新成功');
      fetchAdmins();
    } catch (error: any) {
      message.error(error?.message || '状态更新失败');
    }
  };

  const handleResetPassword = async (id: number) => {
    try {
      const response = await adminService.resetPassword(id);
      if (response.data?.password) {
        Modal.success({
          title: '密码重置成功',
          content: `新密码: ${response.data.password}`,
        });
      }
    } catch (error: any) {
      message.error(error?.message || '密码重置失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingAdmin) {
        const updateData: UpdateAdminDTO = {
          nickname: values.nickname,
          email: values.email,
          mobile: values.mobile,
          group_id: values.group_id,
          avatar: values.avatar,
          status: values.status,
        };
        if (values.password) {
          updateData.password = values.password;
        }
        await adminService.update(editingAdmin.id, updateData);
        message.success('更新成功');
      } else {
        const createData: CreateAdminDTO = {
          username: values.username,
          nickname: values.nickname,
          password: values.password,
          email: values.email,
          mobile: values.mobile,
          group_id: values.group_id,
          avatar: values.avatar,
          status: values.status || 'normal',
        };
        await adminService.create(createData);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchAdmins();
    } catch (error: any) {
      message.error(error?.message || '操作失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'mobile',
      key: 'mobile',
    },
    {
      title: '所属组',
      dataIndex: 'group_name',
      key: 'group_name',
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
      render: (_: any, record: AdminItem) => (
        <Space size="small">
          {canEdit && (
            <Button type="link" size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {canEdit && (
            <Button
              type="link"
              size="small"
              onClick={() => handleStatusChange(record.id, record.status === 'normal' ? 'hidden' : 'normal')}
            >
              {record.status === 'normal' ? '禁用' : '启用'}
            </Button>
          )}
          {canResetPassword && (
            <Button type="link" size="small" onClick={() => handleResetPassword(record.id)}>
              重置密码
            </Button>
          )}
          {canDelete && record.id !== 1 && (
            <Popconfirm
              title="确定删除此管理员？"
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
          <Form.Item name="username" label="用户名">
            <Input placeholder="用户名" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="nickname" label="昵称">
            <Input placeholder="昵称" allowClear style={{ width: 150 }} />
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
            新增管理员
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
        title={editingAdmin ? '编辑管理员' : '新增管理员'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          {!editingAdmin && (
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 2, message: '用户名至少2个字符' },
                { max: 20, message: '用户名最多20个字符' },
              ]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
          )}
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }, { min: 2, message: '昵称至少2个字符' }]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: !editingAdmin, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder={editingAdmin ? '不修改请留空' : '请输入密码'} />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="mobile"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item
            name="group_id"
            label="所属组"
            rules={[{ required: true, message: '请选择所属组' }]}
          >
            <Input type="number" placeholder="请输入组ID" />
          </Form.Item>
          <Form.Item name="avatar" label="头像">
            <Input placeholder="头像URL" />
          </Form.Item>
          {editingAdmin && (
            <Form.Item name="status" label="状态" initialValue="normal">
              <Select>
                <Select.Option value="normal">正常</Select.Option>
                <Select.Option value="hidden">禁用</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
