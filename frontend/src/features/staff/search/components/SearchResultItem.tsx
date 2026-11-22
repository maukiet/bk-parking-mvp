import React from 'react';
import { Car, User, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import type { UserRecord } from './UserDetailCard';

interface SearchResultItemProps {
  user: UserRecord;
  onViewDetail: (user: UserRecord) => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({ user, onViewDetail }) => (
  <div className="bg-surface-card border border-border-muted rounded-2xl p-4 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-surface-subtle border border-border-default flex items-center justify-center shrink-0">
        {user.group === 'GV' || user.group === 'NV' ? (
          <User className="w-5 h-5 text-text-secondary" />
        ) : (
          <Car className="w-5 h-5 text-text-secondary" />
        )}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-text-primary">{user.name}</span>
          <Badge variant={user.group === 'GV' ? 'info' : user.group === 'NV' ? 'warning' : 'neutral'}>
            {user.group}
          </Badge>
        </div>
        <div className="text-xs text-text-secondary mt-0.5">{user.code}</div>
        <div className="text-sm font-bold text-text-primary mt-0.5">
          {user.plate} · {user.vehicle}
        </div>
      </div>
    </div>

    <div className="flex items-center gap-3 shrink-0">
      <div className="flex items-center gap-1 text-xs font-semibold">
        {user.isInLot ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-warning" />
            <span className="text-warning-text">Đang trong bãi</span>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 text-text-secondary" />
            <span className="text-text-secondary">Không trong bãi</span>
          </>
        )}
      </div>
      <Button variant="inverse" onClick={() => onViewDetail(user)}>
        Xem chi tiết
      </Button>
    </div>
  </div>
);

