import React from 'react';
import { Link } from 'react-router';
import { LayoutDashboard, LayoutGrid, AlertCircle, Search, History, Monitor, LogOut } from 'lucide-react';

export type StaffTab = 'dashboard' | 'checkpoint' | 'exception' | 'search' | 'shift';

interface CheckpointSidebarProps {
  activeTab: StaffTab;
  onTabChange: (tab: StaffTab) => void;
}

const navItems: Array<{ id: StaffTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'checkpoint', label: 'Trạm kiểm soát', icon: LayoutGrid },
  { id: 'exception', label: 'Xử lý ngoại lệ', icon: AlertCircle },
  { id: 'search', label: 'Tra cứu xe', icon: Search },
  { id: 'shift', label: 'Lịch sử ca', icon: History },
];

export const CheckpointSidebar: React.FC<CheckpointSidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="w-sidebar h-full bg-surface-card border-r border-border-default flex flex-col items-center py-2 shrink-0 select-none justify-between">
      <div className="w-full flex flex-col items-center">
        <div className="h-14 flex items-center justify-center shrink-0">
          <div className="w-10 h-10 rounded-full bg-surface-inverse text-text-inverse font-bold text-xl flex items-center justify-center">
            P
          </div>
        </div>
        <nav className="flex flex-col gap-1.5 w-full px-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full h-16 rounded-2xl flex flex-col items-center justify-center gap-1 p-1 transition-all ${
                  isActive ? 'bg-surface-inverse text-text-inverse' : 'text-text-secondary hover:bg-surface-subtle'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[10px] font-medium leading-tight text-center">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-1 w-full px-1 pb-1">
        <Link
          to="/public"
          title="Kiosk công khai"
          className="w-full h-10 rounded-xl flex items-center justify-center text-text-secondary hover:bg-surface-subtle"
        >
          <Monitor className="w-4 h-4" />
        </Link>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('bk_access_token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('bk_token');
            localStorage.removeItem('bk_user');
            window.dispatchEvent(new Event('bkparking:auth-changed'));
            window.location.href = '/login';
          }}
          title="Đăng xuất"
          className="w-full h-10 rounded-xl flex items-center justify-center text-danger hover:bg-danger-surface"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
