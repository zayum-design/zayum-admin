import { useState } from 'react';
import { Card, Button, InputNumber, Space, Typography, message, Result } from 'antd';
import { CheckCircleOutlined, GiftOutlined } from '@ant-design/icons';
import { rechargeService } from '../../services/recharge.service';
import { useMemberStore } from '../../store/member.store';

const { Title, Text } = Typography;

const presetScores = [100, 500, 1000, 5000, 10000];

export default function ScoreRecharge() {
  const [score, setScore] = useState<number>(1000);
  const [customScore, setCustomScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { fetchProfile } = useMemberStore();

  const handleScoreChange = (value: number) => {
    setScore(value);
    setCustomScore(null);
  };

  const handleCustomScoreChange = (value: number | null) => {
    setCustomScore(value);
    if (value) {
      setScore(value);
    }
  };

  const handleSubmit = async () => {
    if (!score || score <= 0) {
      message.error('请输入积分数量');
      return;
    }

    setLoading(true);
    try {
      await rechargeService.rechargeScore({ score });
      message.success('积分充值成功');
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
          subTitle={`您已成功获得 ${score} 积分`}
          extra={[
            <Button type="primary" key="member" onClick={() => window.location.href = '/member'}>
              返回会员中心
            </Button>,
            <Button key="again" onClick={() => { setSuccess(false); setScore(1000); }}>
              继续充值
            </Button>,
          ]}
        />
      </Card>
    );
  }

  return (
    <Card title="积分充值">
      <div className="max-w-2xl">
        <div className="mb-6">
          <div className="bg-orange-50 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2 text-orange-600">
              <GiftOutlined />
              <Text className="text-orange-600">积分可用于兑换商品、参与活动等</Text>
            </div>
          </div>

          <Title level={5} className="mb-4">选择积分数量</Title>
          <Space wrap>
            {presetScores.map((s) => (
              <Button
                key={s}
                type={score === s && !customScore ? 'primary' : 'default'}
                onClick={() => handleScoreChange(s)}
                className="w-28"
              >
                {s} 积分
              </Button>
            ))}
          </Space>
          
          <div className="mt-4 flex items-center gap-4">
            <Text>自定义数量:</Text>
            <InputNumber
              value={customScore}
              onChange={handleCustomScoreChange}
              min={1}
              max={1000000}
              precision={0}
              style={{ width: 200 }}
              placeholder="输入积分数量"
              addonAfter="积分"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-8">
          <div className="flex justify-between items-center">
            <Text>获得积分:</Text>
            <Title level={4} className="!mb-0 text-orange-500">{score} 积分</Title>
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
          积分充值后不可退款，请确认后再操作
        </div>
      </div>
    </Card>
  );
}
