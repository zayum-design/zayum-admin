import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'antd/dist/reset.css';

// 页面导入
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import MemberLayout from './layouts/MemberLayout';
import MemberHome from './pages/member';
import MemberProfile from './pages/member/profile';
import BalanceRecords from './pages/member/records/balance';
import ScoreRecords from './pages/member/records/score';
import BalanceRecharge from './pages/recharge/balance';
import ScoreRecharge from './pages/recharge/score';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            {/* 默认重定向到登录 */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 认证页面 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* 会员中心 - 需要登录 */}
            <Route path="/member" element={<MemberLayout />}>
              <Route index element={<MemberHome />} />
              <Route path="profile" element={<MemberProfile />} />
              <Route path="records/balance" element={<BalanceRecords />} />
              <Route path="records/score" element={<ScoreRecords />} />
            </Route>
            
            {/* 充值中心 - 需要登录 */}
            <Route path="/recharge" element={<MemberLayout />}>
              <Route path="balance" element={<BalanceRecharge />} />
              <Route path="score" element={<ScoreRecharge />} />
            </Route>
            
            {/* 404 重定向 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
