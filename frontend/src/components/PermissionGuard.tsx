import type { ReactNode } from 'react';
import { usePermissionStore } from '../store/permission.store';

interface PermissionGuardProps {
  children: ReactNode;
  permission: string;
  type?: 'any' | 'all';
  fallback?: ReactNode;
}

export function PermissionGuard({
  children,
  permission,
  type = 'any',
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission } = usePermissionStore();

  if (type === 'any') {
    const permissions = permission.split(',').map((p) => p.trim());
    if (!hasAnyPermission(permissions)) {
      return <>{fallback}</>;
    }
  } else {
    if (!hasPermission(permission)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

export function usePermission(code: string) {
  const { hasPermission } = usePermissionStore();
  return hasPermission(code);
}
