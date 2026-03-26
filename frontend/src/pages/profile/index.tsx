import { useState, useEffect } from 'react';
import {
  Tabs,
  Form,
  Input,
  Button,
  Avatar,
  Table,
  Tag,
  message,
  DatePicker,
  Radio,
  Progress,
  Upload,
} from 'antd';
import { UserOutlined, LockOutlined, HistoryOutlined, FileTextOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { profileService, type ProfileResponse, type ChangePasswordDto } from '../../services/profile.service';
import { useAuthStore } from '../../store/auth.store';
import { token } from '../../utils/token';
import { uploadService } from '../../services/upload.service';
import type { SysLoginLog, SysOperationLog } from '../../types/entities';

const { TabPane } = Tabs;

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [loginLogs, setLoginLogs] = useState<SysLoginLog[]>([]);
  const [operationLogs, setOperationLogs] = useState<SysOperationLog[]>([]);
  const [loginPagination, setLoginPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [operationPagination, setOperationPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();
  const { logout, setUser } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'login-logs') {
      fetchLoginLogs();
    } else if (activeTab === 'operation-logs') {
      fetchOperationLogs();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      form.setFieldsValue({
        nickname: data.nickname,
        email: data.email,
        mobile: data.mobile,
        gender: data.gender,
        birthday: data.birthday ? dayjs(data.birthday) : null,
      });
    } catch (error) {
      message.error('获取个人信息失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginLogs = async (page = 1, pageSize = 10) => {
    try {
      const result = await profileService.getLoginLogs(page, pageSize);
      setLoginLogs(result.list);
      setLoginPagination({
        current: result.pagination.page,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total,
      });
    } catch (error) {
      message.error('获取登录日志失败');
    }
  };

  const fetchOperationLogs = async (page = 1, pageSize = 10) => {
    try {
      const result = await profileService.getOperationLogs(page, pageSize);
      setOperationLogs(result.list);
      setOperationPagination({
        current: result.pagination.page,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total,
      });
    } catch (error) {
      message.error('获取操作日志失败');
    }
  };

  const handleAvatarChange: UploadProps['onChange'] = async (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      const url = info.file.response.data.url;
      if (profile) {
        const updated = { ...profile, avatar: url };
        setProfile(updated);
        setUser(updated);
        await profileService.updateProfile({ avatar: url });
        message.success('头像更新成功');
      }
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        birthday: values.birthday?.format('YYYY-MM-DD'),
      };
      const updated = await profileService.updateProfile(data);
      setProfile(updated);
      setUser(updated);
      message.success('个人信息更新成功');
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleChangePassword = async (values: ChangePasswordDto) => {
    try {
      await profileService.changePassword(values);
      message.success('密码修改成功，请重新登录');
      setTimeout(() => {
        logout();
        token.remove();
        window.location.href = '/login';
      }, 1500);
    } catch (error: any) {
      message.error(error?.response?.data?.message || '修改密码失败');
    }
  };

  const getPasswordStrength = (password: string): { level: number; percent: number; color: string } => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { level: 0, percent: 0, color: '#d9d9d9' },
      { level: 1, percent: 20, color: '#ff4d4f' },
      { level: 2, percent: 40, color: '#faad14' },
      { level: 3, percent: 60, color: '#faad14' },
      { level: 4, percent: 80, color: '#52c41a' },
      { level: 5, percent: 100, color: '#52c41a' },
    ];
    return levels[Math.min(strength, 5)];
  };

  const avatarUploadProps: UploadProps = {
    name: 'file',
    showUploadList: false,
    action: async (file) => {
      const result = await uploadService.upload(file, 'avatar');
      return result.data.url;
    },
    onChange: handleAvatarChange,
  };

  const loginLogColumns: ColumnsType<SysLoginLog> = [
    { title: '序号', width: 60, render: (_, __, index) => index + 1 },
    { title: '登录时间', dataIndex: 'createdAt', key: 'createdAt' },
    { title: '登录IP', dataIndex: 'ip', key: 'ip' },
    { title: '登录地点', dataIndex: 'location', key: 'location' },
    { title: '浏览器', dataIndex: 'browser', key: 'browser' },
    { title: '操作系统', dataIndex: 'os', key: 'os' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={status === 'success' ? 'green' : 'red'}>{status === 'success' ? '成功' : '失败'}</Tag>,
    },
    { title: '消息', dataIndex: 'message', key: 'message' },
  ];

  const operationLogColumns: ColumnsType<SysOperationLog> = [
    { title: '序号', width: 60, render: (_, __, index) => index + 1 },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt' },
    { title: '模块', dataIndex: 'module', key: 'module' },
    { title: '操作', dataIndex: 'action', key: 'action' },
    { title: '方法', dataIndex: 'method', key: 'method' },
    { title: 'URL', dataIndex: 'url', key: 'url', ellipsis: true },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={status === 'success' ? 'green' : 'red'}>{status === 'success' ? '成功' : '失败'}</Tag>,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><UserOutlined />个人信息</span>} key="info">
          <div style={{ maxWidth: 600 }}>
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <Upload
                {...avatarUploadProps}
                accept="image/*"
              >
                <Avatar
                  size={80}
                  icon={<UserOutlined />}
                  src={profile?.avatar}
                  className="cursor-pointer"
                />
              </Upload>
              <div style={{ marginTop: 8, color: '#999' }}>点击头像更换</div>
            </div>
            <Form form={form} layout="vertical">
              <Form.Item label="用户名">
                <Input value={profile?.username} disabled />
              </Form.Item>
              <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
                <Input placeholder="请输入昵称" />
              </Form.Item>
              <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入正确的邮箱格式' }]}>
                <Input placeholder="请输入邮箱" />
              </Form.Item>
              <Form.Item name="mobile" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
              <Form.Item name="gender" label="性别">
                <Radio.Group>
                  <Radio value="male">男</Radio>
                  <Radio value="female">女</Radio>
                  <Radio value="unknown">未知</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="birthday" label="生日">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="用户组">
                <Input value={profile?.groupName} disabled />
              </Form.Item>
              <Form.Item label="注册时间">
                <Input value={profile?.createdAt} disabled />
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={handleUpdateProfile} loading={loading}>
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </div>
        </TabPane>

        <TabPane tab={<span><LockOutlined />修改密码</span>} key="password">
          <div style={{ maxWidth: 400 }}>
            <PasswordForm onSubmit={handleChangePassword} getPasswordStrength={getPasswordStrength} />
          </div>
        </TabPane>

        <TabPane tab={<span><HistoryOutlined />登录日志</span>} key="login-logs">
          <Table
            columns={loginLogColumns}
            dataSource={loginLogs}
            rowKey="id"
            pagination={{
              current: loginPagination.current,
              pageSize: loginPagination.pageSize,
              total: loginPagination.total,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page, pageSize) => fetchLoginLogs(page, pageSize),
            }}
          />
        </TabPane>

        <TabPane tab={<span><FileTextOutlined />操作日志</span>} key="operation-logs">
          <Table
            columns={operationLogColumns}
            dataSource={operationLogs}
            rowKey="id"
            pagination={{
              current: operationPagination.current,
              pageSize: operationPagination.pageSize,
              total: operationPagination.total,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page, pageSize) => fetchOperationLogs(page, pageSize),
            }}
          />
        </TabPane>
      </Tabs>
    </div>
  );
}

function PasswordForm({
  onSubmit,
  getPasswordStrength,
}: {
  onSubmit: (values: ChangePasswordDto) => void;
  getPasswordStrength: (password: string) => { level: number; percent: number; color: string };
}) {
  const [form] = Form.useForm();
  const [passwordStrength, setPasswordStrength] = useState({ level: 0, percent: 0, color: '#d9d9d9' });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setPasswordStrength(getPasswordStrength(password));
  };

  return (
    <Form form={form} onFinish={onSubmit} layout="vertical">
      <Form.Item
        name="oldPassword"
        label="旧密码"
        rules={[{ required: true, message: '请输入旧密码' }]}
      >
        <Input.Password placeholder="请输入旧密码" />
      </Form.Item>
      <Form.Item
        name="newPassword"
        label="新密码"
        rules={[
          { required: true, message: '请输入新密码' },
          { min: 6, message: '密码至少6位' },
          { max: 20, message: '密码最多20位' },
        ]}
      >
        <Input.Password
          placeholder="请输入新密码"
          onChange={handlePasswordChange}
        />
      </Form.Item>
      <Form.Item label="密码强度">
        <Progress percent={passwordStrength.percent} showInfo={false} strokeColor={passwordStrength.color} />
        <div style={{ color: passwordStrength.color, fontSize: 12 }}>
          {passwordStrength.level === 0 && '请输入密码'}
          {passwordStrength.level === 1 && '弱'}
          {passwordStrength.level === 2 && '较弱'}
          {passwordStrength.level === 3 && '中等'}
          {passwordStrength.level === 4 && '较强'}
          {passwordStrength.level === 5 && '强'}
        </div>
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label="确认密码"
        dependencies={['newPassword']}
        rules={[
          { required: true, message: '请确认密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致'));
            },
          }),
        ]}
      >
        <Input.Password placeholder="请再次输入新密码" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          修改密码
        </Button>
      </Form.Item>
    </Form>
  );
}
