import { useEffect } from 'react';
import { Card, Table, Tag } from 'antd';
import { useMemberStore } from '../../../store/member.store';
import dayjs from 'dayjs';

export default function ScoreRecords() {
  const { scoreRecords, fetchScoreRecords, isLoading } = useMemberStore();

  useEffect(() => {
    fetchScoreRecords();
  }, [fetchScoreRecords]);

  const columns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const color = type === 'recharge' ? 'green' : type === 'consume' ? 'red' : 'blue';
        const text = type === 'recharge' ? '获得' : type === 'consume' ? '使用' : '其他';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '变动积分',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <span className={score > 0 ? 'text-green-500' : 'text-red-500'}>
          {score > 0 ? '+' : ''}{score}
        </span>
      ),
    },
    {
      title: '变动前积分',
      dataIndex: 'beforeScore',
      key: 'beforeScore',
    },
    {
      title: '变动后积分',
      dataIndex: 'afterScore',
      key: 'afterScore',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
  ];

  return (
    <Card title="积分记录">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={scoreRecords}
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </Card>
  );
}
