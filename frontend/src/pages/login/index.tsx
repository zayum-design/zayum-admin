import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/auth.store';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, afterLogin } = useAuthStore();

  const onFinish = async (values: { username: string; password: string; remember?: boolean }) => {
    setLoading(true);
    try {
      await login({ username: values.username, password: values.password });
      await afterLogin();
      message.success('登录成功');
      navigate('/admin');
    } catch (error: any) {
      message.error(error?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <Card className="w-full max-w-md shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Zayum Admin</h1>
          <p className="text-gray-500 mt-2">管理员登录</p>
        </div>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="用户名: admin"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="密码: Admin@888888"
            />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <div className="flex justify-between items-center">
              <Checkbox>记住我</Checkbox>
              <a href="#" className="text-blue-500 text-sm">忘记密码?</a>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
