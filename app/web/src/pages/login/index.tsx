import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message, Tabs, Typography } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';

const { Title } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [activeTab, setActiveTab] = useState('password');
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { loginByPassword, loginBySms } = useAuthStore();

  // 密码登录
  const handlePasswordLogin = async (values: { phone: string; password: string }) => {
    setLoading(true);
    try {
      await loginByPassword(values.phone, values.password);
      message.success('登录成功');
      navigate('/member');
    } catch (error: any) {
      message.error(error?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 验证码登录
  const handleSmsLogin = async (values: { phone: string; code: string }) => {
    setLoading(true);
    try {
      await loginBySms(values.phone, values.code);
      message.success('登录成功');
      navigate('/member');
    } catch (error: any) {
      message.error(error?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    const phone = form.getFieldValue('phone');
    if (!phone) {
      message.error('请输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      message.error('请输入正确的手机号');
      return;
    }

    setSmsLoading(true);
    try {
      await authService.sendSmsCode({ phone, type: 'login' });
      message.success('验证码已发送');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      message.error(error?.message || '发送失败');
    } finally {
      setSmsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <Title level={2} className="!mb-2">会员登录</Title>
          <p className="text-gray-500">欢迎回来，请登录您的账户</p>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            {
              key: 'password',
              label: '密码登录',
              children: (
                <Form
                  name="passwordLogin"
                  onFinish={handlePasswordLogin}
                  layout="vertical"
                  size="large"
                >
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined className="text-gray-400" />}
                      placeholder="请输入手机号"
                      maxLength={11}
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
                      placeholder="请输入密码"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      className="w-full"
                      size="large"
                    >
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'sms',
              label: '验证码登录',
              children: (
                <Form
                  name="smsLogin"
                  form={form}
                  onFinish={handleSmsLogin}
                  layout="vertical"
                  size="large"
                >
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined className="text-gray-400" />}
                      placeholder="请输入手机号"
                      maxLength={11}
                    />
                  </Form.Item>

                  <Form.Item
                    name="code"
                    rules={[
                      { required: true, message: '请输入验证码' },
                      { len: 6, message: '验证码为6位数字' },
                    ]}
                  >
                    <Input
                      prefix={<SafetyOutlined className="text-gray-400" />}
                      placeholder="请输入验证码"
                      maxLength={6}
                      suffix={
                        <Button
                          type="link"
                          loading={smsLoading}
                          disabled={countdown > 0}
                          onClick={handleSendCode}
                        >
                          {countdown > 0 ? `${countdown}s` : '获取验证码'}
                        </Button>
                      }
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      className="w-full"
                      size="large"
                    >
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />

        <div className="text-center mt-4">
          <span className="text-gray-500">还没有账户？</span>
          <Link to="/register" className="ml-2 text-blue-500 hover:text-blue-600">
            立即注册
          </Link>
        </div>
      </Card>
    </div>
  );
}
