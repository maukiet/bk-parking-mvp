import React from 'react';
import { Link, useNavigate } from 'react-router';
import { LayoutDashboard, ScanLine, Search, History, Monitor, LogOut } from 'lucide-react';
import { useAuth } from '../../../../shared/auth/AuthContext';
import { clearSession } from '../../../auth/authApi';
import type { StaffTab } from '../types';

interface CheckpointSidebarProps {
  activeTab: StaffTab;
  onTabChange: (tab: StaffTab) => void;
  activeCount: number;
}

const navItems: Array<{
  id: StaffTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'checkpoint', label: 'Trạm kiểm soát', icon: ScanLine },
  { id: 'search', label: 'Tra cứu xe', icon: Search },
  { id: 'shift', label: 'Nhật ký ra/vào', icon: History },
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
];

export const CheckpointSidebar: React.FC<CheckpointSidebarProps> = ({
  activeTab,
  onTabChange,
  activeCount,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    clearSession();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-sidebar h-full bg-surface-card border-r border-border-default flex flex-col items-center py-2 shrink-0 select-none justify-between">
      <div className="w-full flex flex-col items-center">
        <div className="h-14 flex items-center justify-center shrink-0">
          <div className="w-10 h-10 rounded-full bg-surface-inverse text-text-inverse font-bold text-xl flex items-center justify-center">
            P
          </div>
        </div>
        <nav className="flex flex-col gap-1.5 w-full px-1 mt-1" aria-label="Điều hướng trạm bảo vệ">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative w-full h-16 rounded-2xl flex flex-col items-center justify-center gap-1 p-1 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-surface-inverse text-text-inverse'
                    : 'text-text-secondary hover:bg-surface-subtle'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[10px] font-medium leading-tight text-center">{item.label}</span>
                {item.id === 'shift' && activeCount > 0 && (
                  <span
                    className={`absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                      isActive ? 'bg-success text-text-inverse' : 'bg-info-surface text-info-text border border-info-border'
                    }`}
                  >
                    {activeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-1 w-full px-1 pb-1">
        <Link
          to="/public"
          title="Xem bảng điện tử công khai"
          className="w-full h-10 rounded-xl flex items-center justify-center text-text-secondary hover:bg-surface-subtle"
        >
          <Monitor className="w-4 h-4" />
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          title="Đăng xuất"
          className="w-full h-10 rounded-xl flex items-center justify-center text-danger hover:bg-danger-surface cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
