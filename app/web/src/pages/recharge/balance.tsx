import { useState } from 'react';
import { Card, Button, InputNumber, Radio, Space, Typography, message, Result } from 'antd';
import { CheckCircleOutlined, WalletOutlined } from '@ant-design/icons';
import { rechargeService } from '../../services/recharge.service';
import { useMemberStore } from '../../store/member.store';

const { Title, Text } = Typography;

const presetAmounts = [50, 100, 200, 500, 1000];

export default function BalanceRecharge() {
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('alipay');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { fetchProfile } = useMemberStore();

  const handleAmountChange = (value: number) => {
    setAmount(value);
    setCustomAmount(null);
  };

  const handleCustomAmountChange = (value: number | null) => {
    setCustomAmount(value);
    if (value) {
      setAmount(value);
    }
  };

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      message.error('请输入充值金额');
      return;
    }

    setLoading(true);
    try {
      await rechargeService.rechargeBalance({
        amount,
        paymentMethod,
      });
      message.success('充值成功');
      setSuccess(true);
      fetchProfile();
    } catch (error: any) {
      message.error(error?.message || '充值失败');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <Result
          status="success"
          icon={<CheckCircleOutlined className="text-green-500" />}
          title="充值成功"
          subTitle={`您已成功充值 ¥${amount}`}
          extra={[
            <Button type="primary" key="member" onClick={() => window.location.href = '/member'}>
              返回会员中心
            </Button>,
            <Button key="again" onClick={() => { setSuccess(false); setAmount(100); }}>
              继续充值
            </Button>,
          ]}
        />
      </Card>
    );
  }

  return (
    <Card title="余额充值">
      <div className="max-w-2xl">
        <div className="mb-8">
          <Title level={5} className="mb-4">选择充值金额</Title>
          <Radio.Group 
            value={presetAmounts.includes(amount) ? amount : null} 
            onChange={(e) => handleAmountChange(e.target.value)}
          >
            <Space wrap>
              {presetAmounts.map((amt) => (
                <Radio.Button key={amt} value={amt} className="w-24 text-center">
                  ¥{amt}
                </Radio.Button>
              ))}
            </Space>
          </Radio.Group>
          
          <div className="mt-4 flex items-center gap-4">
            <Text>自定义金额:</Text>
            <InputNumber
              value={customAmount}
              onChange={handleCustomAmountChange}
              min={1}
              max={100000}
              precision={2}
              prefix="¥"
              style={{ width: 200 }}
              placeholder="输入金额"
            />
          </div>
        </div>

        <div className="mb-8">
          <Title level={5} className="mb-4">选择支付方式</Title>
          <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <Space direction="vertical">
              <Radio value="alipay">
                <div className="flex items-center gap-2">
                  <WalletOutlined className="text-blue-500" />
                  <span>支付宝</span>
                </div>
              </Radio>
              <Radio value="wechat">
                <div className="flex items-center gap-2">
                  <WalletOutlined className="text-green-500" />
                  <span>微信支付</span>
                </div>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-8">
          <div className="flex justify-between items-center">
            <Text>充值金额:</Text>
            <Title level={4} className="!mb-0 text-orange-500">¥{amount}</Title>
          </div>
        </div>

        <Button 
          type="primary" 
          size="large" 
          block 
          onClick={handleSubmit}
          loading={loading}
        >
          立即充值
        </Button>

        <div className="mt-4 text-gray-400 text-sm text-center">
          点击充值即表示您同意《充值服务协议》
        </div>
      </div>
    </Card>
  );
}
