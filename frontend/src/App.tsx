import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'antd/dist/reset.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import AuthGuard from './components/AuthGuard';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/login';
import DashboardPage from './pages/dashboard';
import PermissionManagement from './pages/system/permission';
import AdminManagement from './pages/system/admin';
import AdminGroupManagement from './pages/system/admin-group';
import UserManagement from './pages/user/list';
import UserGroupManagement from './pages/user/group';
import OperationLog from './pages/log/operation';
import LoginLog from './pages/log/login';
import ConfigManagement from './pages/system/config';
import FileManagement from './pages/system/file';
import NotificationList from './pages/message/list';
import ProfilePage from './pages/profile';
import UserScorePage from './pages/user-score';
import UserBalancePage from './pages/user-balance';
import CodeGeneratorPage from './pages/code-generator';
import SysTestPage from './pages/test';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <ErrorBoundary>
                  <AuthGuard>
                    <MainLayout />
                  </AuthGuard>
                </ErrorBoundary>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="system" element={<Navigate to="/admin/system/permission" replace />} />
              <Route path="system/permission" element={<PermissionManagement />} />
              <Route path="system/admin" element={<AdminManagement />} />
              <Route path="system/admin/group" element={<AdminGroupManagement />} />
              <Route path="system/user" element={<Navigate to="/admin/user/list" replace />} />
              <Route path="system/user/group" element={<Navigate to="/admin/user/group" replace />} />
              <Route path="system/config" element={<ConfigManagement />} />
              <Route path="system/file" element={<FileManagement />} />
              <Route path="user/list" element={<UserManagement />} />
              <Route path="user/group" element={<UserGroupManagement />} />
              <Route path="user/score" element={<UserScorePage />} />
              <Route path="user/balance" element={<UserBalancePage />} />
              <Route path="log" element={<Navigate to="/admin/log/operation" replace />} />
              <Route path="log/operation" element={<OperationLog />} />
              <Route path="log/login" element={<LoginLog />} />
              <Route path="config" element={<Navigate to="/admin/system/config" replace />} />
              <Route path="upload" element={<Navigate to="/admin/system/file" replace />} />
              <Route path="notification" element={<Navigate to="/admin/message/list" replace />} />
              <Route path="message/list" element={<NotificationList />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="code-generator" element={<CodeGeneratorPage />} />
                          <Route path="test" element={<SysTestPage />} />
              </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
