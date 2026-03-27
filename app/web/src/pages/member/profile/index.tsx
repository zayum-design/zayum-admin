import { useEffect } from 'react';
import { Card, Form, Input, Button, message, Avatar, Upload, Radio, DatePicker } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { useMemberStore } from '../../../store/member.store';
import dayjs from 'dayjs';

export default function MemberProfile() {
  const [form] = Form.useForm();
  const { profile, updateProfile, fetchProfile, isLoading } = useMemberStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        nickname: profile.nickname,
        email: profile.email,
        gender: profile.gender,
        birthday: profile.birthday ? dayjs(profile.birthday) : null,
      });
    }
  }, [profile, form]);

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
      };
      await updateProfile(data);
      message.success('保存成功');
    } catch (error: any) {
      message.error(error?.message || '保存失败');
    }
  };

  return (
    <Card title="个人信息">
      <div className="max-w-2xl">
        <div className="flex items-center gap-6 mb-8">
          <Avatar size={100} src={profile?.avatar} icon={<UserOutlined />} />
          <div>
            <div className="text-gray-500 mb-2">头像</div>
            <Button icon={<UploadOutlined />}>更换头像</Button>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="手机号"
          >
            <Input value={profile?.mobile} disabled />
          </Form.Item>

          <Form.Item
            label="昵称"
            name="nickname"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" maxLength={50} />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[{ type: 'email', message: '请输入正确的邮箱' }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="性别"
            name="gender"
          >
            <Radio.Group>
              <Radio value="male">男</Radio>
              <Radio value="female">女</Radio>
              <Radio value="unknown">保密</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="生日"
            name="birthday"
          >
            <DatePicker style={{ width: '100%' }} placeholder="选择生日" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Card>
  );
}
