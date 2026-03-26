import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Radio,
  message,
  Popconfirm,
  Space,
  Tag,
  Image,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { userService } from '../../../services/user.service';
import type { QueryUserDTO, CreateUserDTO, UpdateUserDTO, UserItem } from '../../../services/user.service';
import { usePermissionStore } from '../../../store/permission.store';

export default function UserManagement() {
  const [data, setData] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [resetPasswordForm] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState<QueryUserDTO>({});
  const { hasPermission } = usePermissionStore();

  const canCreate = hasPermission('user:list:create');
  const canEdit = hasPermission('user:list:edit');
  const canDelete = hasPermission('user:list:delete');

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize, searchParams]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        ...searchParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      const response = await userService.getList(params);
      if (response.data) {
        setData(response.data.list);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
        }));
      }
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: QueryUserDTO) => {
    setSearchParams(values);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setSearchParams({});
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: UserItem) => {
    setEditingUser(record);
    form.setFieldsValue({
      nickname: record.nickname,
      email: record.email,
      mobile: record.mobile,
      group_id: record.group_id,
      avatar: record.avatar,
      gender: record.gender,
      birthday: record.birthday,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await userService.delete(id);
      message.success('删除成功');
      fetchUsers();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的用户');
      return;
    }
    try {
      await userService.batchDelete(selectedRowKeys as number[]);
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      fetchUsers();
    } catch (error: any) {
      message.error(error?.message || '批量删除失败');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await userService.updateStatus(id, status);
      message.success('状态更新成功');
      fetchUsers();
    } catch (error: any) {
      message.error(error?.message || '状态更新失败');
    }
  };

  const handleResetPassword = (id: number) => {
    setResetPasswordUserId(id);
    resetPasswordForm.resetFields();
    setResetPasswordModalVisible(true);
  };

  const handleResetPasswordSubmit = async () => {
    try {
      const values = await resetPasswordForm.validateFields();
      const response = await userService.resetPassword(resetPasswordUserId!, values.new_password);
      if (response.data?.password) {
        Modal.success({
          title: '密码重置成功',
          content: `新密码: ${response.data.password}`,
        });
        setResetPasswordModalVisible(false);
      }
    } catch (error: any) {
      message.error(error?.message || '密码重置失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        const updateData: UpdateUserDTO = {
          nickname: values.nickname,
          email: values.email,
          mobile: values.mobile,
          group_id: values.group_id,
          avatar: values.avatar,
          gender: values.gender,
          birthday: values.birthday,
          status: values.status,
        };
        if (values.password) {
          updateData.password = values.password;
        }
        await userService.update(editingUser.id, updateData);
        message.success('更新成功');
      } else {
        const createData: CreateUserDTO = {
          username: values.username,
          nickname: values.nickname,
          password: values.password,
          email: values.email,
          mobile: values.mobile,
          group_id: values.group_id,
          avatar: values.avatar,
          gender: values.gender,
          birthday: values.birthday,
          status: values.status || 'normal',
        };
        await userService.create(createData);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error: any) {
      message.error(error?.message || '操作失败');
    }
  };

  const genderMap: Record<string, string> = {
    male: '男',
    female: '女',
    unknown: '未知',
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    normal: { color: 'green', text: '正常' },
    hidden: { color: 'gray', text: '禁用' },
    locked: { color: 'red', text: '锁定' },
  };

  const columns: ColumnsType<UserItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 70,
      render: (avatar: string) => (avatar ? <Image src={avatar} width={40} height={40} /> : null),
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
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => genderMap[gender] || gender,
    },
    {
      title: '用户组',
      dataIndex: 'group_name',
      key: 'group_name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusMap[status]?.color}>
          {statusMap[status]?.text || status}
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
      width: 220,
      render: (_: any, record: UserItem) => (
        <Space size="small">
          {canEdit && (
            <Button type="link" size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {canEdit && (
            <Button type="link" size="small" onClick={() => handleStatusChange(record.id, record.status === 'normal' ? 'hidden' : 'normal')}>
              {record.status === 'normal' ? '禁用' : '启用'}
            </Button>
          )}
          {canEdit && (
            <Button type="link" size="small" onClick={() => handleResetPassword(record.id)}>
              重置密码
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title="确定删除此用户？"
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

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div>
      <div className="mb-4">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="username" label="用户名">
            <Input placeholder="用户名" allowClear style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="nickname" label="昵称">
            <Input placeholder="昵称" allowClear style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="状态" allowClear style={{ width: 100 }}>
              <Select.Option value="normal">正常</Select.Option>
              <Select.Option value="hidden">禁用</Select.Option>
              <Select.Option value="locked">锁定</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select placeholder="性别" allowClear style={{ width: 80 }}>
              <Select.Option value="male">男</Select.Option>
              <Select.Option value="female">女</Select.Option>
              <Select.Option value="unknown">未知</Select.Option>
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
        <Space>
          {canCreate && (
            <Button type="primary" onClick={handleCreate}>
              新增用户
            </Button>
          )}
          {canDelete && (
            <Button danger onClick={handleBatchDelete} disabled={selectedRowKeys.length === 0}>
              批量删除
            </Button>
          )}
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        rowSelection={rowSelection}
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
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          {!editingUser && (
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
              { required: !editingUser, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder={editingUser ? '不修改请留空' : '请输入密码'} />
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
            label="用户组"
            rules={[{ required: true, message: '请选择用户组' }]}
          >
            <Input type="number" placeholder="请输入用户组ID" />
          </Form.Item>
          <Form.Item name="gender" label="性别" initialValue="unknown">
            <Radio.Group>
              <Radio value="male">男</Radio>
              <Radio value="female">女</Radio>
              <Radio value="unknown">未知</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="avatar" label="头像">
            <Input placeholder="头像URL" />
          </Form.Item>
          {editingUser && (
            <Form.Item name="status" label="状态" initialValue="normal">
              <Select>
                <Select.Option value="normal">正常</Select.Option>
                <Select.Option value="hidden">禁用</Select.Option>
                <Select.Option value="locked">锁定</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title="重置密码"
        open={resetPasswordModalVisible}
        onOk={handleResetPasswordSubmit}
        onCancel={() => setResetPasswordModalVisible(false)}
        width={400}
      >
        <Form form={resetPasswordForm} layout="vertical">
          <Form.Item
            name="new_password"
            label="新密码"
            rules={[{ min: 6, message: '密码至少6个字符' }]}
          >
            <Input.Password placeholder="不填则生成随机密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
