import { type ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '../store/auth.store';
import { usePermissionStore } from '../store/permission.store';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, fetchUser, afterLogin, init, user } = useAuthStore();
  const { permissions } = usePermissionStore();
  const [initialized, setInitialized] = useState(false);

  // 初始化
  useEffect(() => {
    init();
    setInitialized(true);
  }, [init]);

  // 未登录跳转登录页
  useEffect(() => {
    if (initialized && !isLoading && !isAuthenticated) {
      navigate('/admin/login', { state: { from: location } });
    }
  }, [initialized, isLoading, isAuthenticated, navigate, location]);

  // 获取用户信息
  useEffect(() => {
    if (initialized && isAuthenticated && !user) {
      fetchUser();
    }
  }, [initialized, isAuthenticated, user, fetchUser]);

  // 获取权限和菜单 - 等待 user 加载完成后调用
  useEffect(() => {
    if (user && permissions.length === 0) {
      afterLogin();
    }
  }, [user, permissions.length, afterLogin]);

  if (!initialized || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return <>{children}</>;
}
