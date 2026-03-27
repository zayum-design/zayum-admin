import { useEffect } from 'react';
import { Card, Table, Tag } from 'antd';
import { useMemberStore } from '../../../store/member.store';
import dayjs from 'dayjs';

export default function BalanceRecords() {
  const { balanceRecords, fetchBalanceRecords, isLoading } = useMemberStore();

  useEffect(() => {
    fetchBalanceRecords();
  }, [fetchBalanceRecords]);

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
        const text = type === 'recharge' ? '充值' : type === 'consume' ? '消费' : '其他';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '变动金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span className={amount > 0 ? 'text-green-500' : 'text-red-500'}>
          {amount > 0 ? '+' : ''}¥{amount}
        </span>
      ),
    },
    {
      title: '变动前余额',
      dataIndex: 'beforeBalance',
      key: 'beforeBalance',
      render: (val: number) => `¥${val}`,
    },
    {
      title: '变动后余额',
      dataIndex: 'afterBalance',
      key: 'afterBalance',
      render: (val: number) => `¥${val}`,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
  ];

  return (
    <Card title="余额记录">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={balanceRecords}
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
