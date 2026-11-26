import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, XCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { UserDetailCard, type UserRecord } from './UserDetailCard';
import { SearchResultItem } from './SearchResultItem';
import { searchApi } from '../api/searchApi';

interface VehicleSearchViewProps {
  onBackToCheckpoint: () => void;
  onGoToException: () => void;
}

type SearchMode = 'list' | 'detail';

export const VehicleSearchView: React.FC<VehicleSearchViewProps> = ({
  onBackToCheckpoint,
  onGoToException,
}) => {
  const [keyword, setKeyword] = useState('');
  const [mode, setMode] = useState<SearchMode>('list');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [searchResults, setSearchResults] = useState<UserRecord[]>([]);

  const trimmed = keyword.trim();

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    setMode('list');
    setSelectedUser(null);
    if (value.trim().length < 2) {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    if (trimmed.length < 2) return;
    let cancelled = false;
    searchApi.searchVehicles(trimmed).then((res) => {
      if (!cancelled) setSearchResults(res);
    });
    return () => {
      cancelled = true;
    };
  }, [trimmed]);

  const handleViewDetail = (user: UserRecord) => {
    setSelectedUser(user);
    setMode('detail');
  };

  const handleBack = () => {
    setMode('list');
    setSelectedUser(null);
  };

  return (
    <main className="flex-1 p-3 flex flex-col gap-3 overflow-hidden">
      <section className="bg-surface-card border border-border-muted rounded-2xl p-4 flex flex-col gap-2 shrink-0 shadow-sm">
        <div className="flex items-center justify-between">
          {mode === 'detail' && selectedUser ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm font-bold text-text-primary hover:opacity-70"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
            </button>
          ) : (
            <h2 className="text-xl font-bold text-text-primary">Tra cứu phương tiện</h2>
          )}
          <span className="text-xs text-text-secondary">Nhập MSSV, mã cán bộ hoặc biển số xe</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-surface-subtle border border-border-default rounded-full px-4 min-h-touch">
            <Search className="w-5 h-5 text-text-secondary shrink-0" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              placeholder="Ví dụ: 2311770 hoặc 59X3-682.45"
              className="bg-transparent text-text-primary text-base font-bold w-full focus:outline-none"
            />
          </div>
          {keyword && (
            <Button variant="outline" onClick={() => handleKeywordChange('')}>
              Xóa
            </Button>
          )}
        </div>

        {mode === 'list' && !keyword && (
          <div className="flex items-center gap-1.5 pt-0.5 text-xs text-text-secondary">
            <span>Gợi ý:</span>
            {['2311770', '59X3-682.45', '51A-123.45'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setKeyword(val)}
                className="px-2 py-0.5 rounded-full bg-surface-subtle hover:bg-surface-hover text-text-primary border border-border-default font-medium"
              >
                {val}
              </button>
            ))}
          </div>
        )}
      </section>

      {mode === 'list' ? (
        <section className="flex-1 overflow-y-auto flex flex-col gap-2">
          {trimmed.length < 2 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-text-secondary">
              <Search className="w-10 h-10 opacity-30" />
              <span className="text-sm font-semibold">Nhập MSSV hoặc biển số để tìm kiếm</span>
              <span className="text-xs">Cần ít nhất 2 ký tự</span>
            </div>
          )}

          {trimmed.length >= 2 && searchResults.length > 0 &&
            searchResults.map((u) => (
              <SearchResultItem key={u.id} user={u} onViewDetail={handleViewDetail} />
            ))
          }

          {trimmed.length >= 2 && searchResults.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-text-secondary">
              <XCircle className="w-10 h-10 opacity-30" />
              <span className="text-sm font-semibold">Không tìm thấy kết quả</span>
              <span className="text-xs">Kiểm tra lại MSSV hoặc biển số</span>
            </div>
          )}
        </section>
      ) : (
        selectedUser && <UserDetailCard user={selectedUser} />
      )}

      <footer className="h-actionbar bg-surface-card border border-border-muted rounded-2xl px-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="subtle" onClick={onBackToCheckpoint}>Về Trạm kiểm soát</Button>
          <Button variant="subtle" onClick={onGoToException}>Chuyển Xử lý ngoại lệ</Button>
        </div>
        <div className="text-xs text-text-secondary">Dữ liệu chỉ đọc · Không ảnh hưởng lượt gửi xe</div>
      </footer>
    </main>
  );
};
