import { Card, Typography } from 'antd';

const { Title } = Typography;

export default function DashboardPage() {
  return (
    <div>
      <Title level={2}>仪表盘</Title>
      <Card>
        <p>欢迎使用 Zayum Admin 后台管理系统</p>
      </Card>
    </div>
  );
}
