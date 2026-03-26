import { useMemo } from 'react';
import { Menu, Tooltip } from 'antd';
import {
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  UploadOutlined,
  BellOutlined,
  KeyOutlined,
  FileSearchOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissionStore } from '../store/permission.store';

const iconMap: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  SettingOutlined: <SettingOutlined />,
  UserOutlined: <UserOutlined />,
  TeamOutlined: <TeamOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  UploadOutlined: <UploadOutlined />,
  BellOutlined: <BellOutlined />,
  KeyOutlined: <KeyOutlined />,
  FileSearchOutlined: <FileSearchOutlined />,
  LoginOutlined: <LoginOutlined />,
};

interface Permission {
  id: number;
  parentId: number;
  name: string;
  code: string;
  type: 'menu' | 'button' | 'api';
  path?: string;
  icon?: string;
  component?: string;
  sort: number;
  status: string;
  children?: Permission[];
}

interface SideMenuProps {
  collapsed?: boolean;
}

export function SideMenu({ collapsed = false }: SideMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { menus } = usePermissionStore();

  const selectedKey = location.pathname;

  // 直接使用后端返回的树形结构
  const menuItems = useMemo(() => {
    if (!menus || menus.length === 0) {
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const convertMenu = (menu: any): any => ({
      key: menu.path || menu.code,
      icon: menu.icon ? iconMap[menu.icon] : undefined,
      label: collapsed ? (
        <Tooltip title={menu.name} placement="right">
          <span>{menu.name}</span>
        </Tooltip>
      ) : (
        menu.name
      ),
      children: menu.children?.length > 0
        ? menu.children.map(convertMenu)
        : undefined,
    });

    return menus.map(convertMenu);
  }, [menus, collapsed]);

  const handleClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  if (!menus || menus.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>
        暂无菜单权限
      </div>
    );
  }

  return (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      defaultOpenKeys={menus.map((m: Permission) => m.path || m.code)}
      items={menuItems}
      onClick={handleClick}
      style={{ height: '100%', borderRight: 0 }}
      theme="light"
      inlineCollapsed={collapsed}
    />
  );
}
