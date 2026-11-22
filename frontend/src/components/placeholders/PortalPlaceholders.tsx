import React from 'react';
import { Link } from 'react-router';
import { User, Shield, ArrowLeft } from 'lucide-react';

export const UserPortalPlaceholder: React.FC = () => (
  <div className="min-h-screen w-full bg-surface-app flex flex-col items-center justify-center p-6 text-center">
    <div className="bg-surface-card border border-border-default rounded-3xl p-8 max-w-md shadow-lg flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-info-surface text-info flex items-center justify-center">
        <User className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold text-text-primary">Cổng thông tin Người dùng (User Portal)</h2>
      <p className="text-xs text-text-secondary leading-relaxed">
        Phân hệ này (Dashboard, Quản lý xe, Đặt chỗ, Gói đỗ xe) do <strong>Thành viên 3 (TV3)</strong> phụ trách phát triển trên branch <code>feat/tv3-user-portal</code>.
      </p>
      <div className="flex items-center gap-2 mt-2">
        <Link to="/login" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-subtle text-xs font-bold text-text-primary border border-border-default">
          <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
        </Link>
        <Link to="/staff" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-inverse text-xs font-bold text-text-inverse">
          Vào Staff Portal (TV5)
        </Link>
      </div>
    </div>
  </div>
);

export const AdminPortalPlaceholder: React.FC = () => (
  <div className="min-h-screen w-full bg-surface-app flex flex-col items-center justify-center p-6 text-center">
    <div className="bg-surface-card border border-border-default rounded-3xl p-8 max-w-md shadow-lg flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-warning-surface text-warning flex items-center justify-center">
        <Shield className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold text-text-primary">Cổng Quản trị viên (Admin Portal)</h2>
      <p className="text-xs text-text-secondary leading-relaxed">
        Phân hệ này (Quản lý bãi, Duyệt xe, Đặt chỗ, Đối soát) do <strong>Thành viên 4 (TV4)</strong> phụ trách phát triển trên branch <code>feat/tv4-admin-portal</code>.
      </p>
      <div className="flex items-center gap-2 mt-2">
        <Link to="/login" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-subtle text-xs font-bold text-text-primary border border-border-default">
          <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
        </Link>
        <Link to="/staff" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-inverse text-xs font-bold text-text-inverse">
          Vào Staff Portal (TV5)
        </Link>
      </div>
    </div>
  </div>
);
