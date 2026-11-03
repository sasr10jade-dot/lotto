import React, { useState } from 'react';
import { Search, Star, Download, Trash2, X } from 'lucide-react';
import { TranslationRecord } from '../../types';
import { HistoryCard } from './HistoryCard';
import './History.css';

interface HistoryListProps {
  records: TranslationRecord[];
  onToggleFavorite: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onExport: (format: 'txt' | 'json') => void;
  onSpeak: (text: string) => void;
  onSelectRecord: (record: TranslationRecord) => void;
  onClose: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  records,
  onToggleFavorite,
  onDeleteRecord,
  onClearAll,
  onExport,
  onSpeak,
  onSelectRecord,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.sourceText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.translatedText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFav = onlyFavorites ? r.isFavorite : true;
    return matchesSearch && matchesFav;
  });

  return (
    <div className="history-drawer-wrapper">
      <div className="history-drawer">
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <h2 className="drawer-title">번역 기록</h2>
            <span className="drawer-count-badge">{records.length}개</span>
          </div>

          <div className="drawer-header-actions">
            <button
              type="button"
              className="drawer-close-btn"
              onClick={onClose}
              title="기록 창 닫기"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="history-toolbar">
          <div className="history-search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="원문 또는 번역 결과 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="history-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            className={`fav-filter-pill ${onlyFavorites ? 'active' : ''}`}
            onClick={() => setOnlyFavorites(!onlyFavorites)}
          >
            <Star size={13} fill={onlyFavorites ? '#f59e0b' : 'none'} />
            <span>즐겨찾기</span>
          </button>
        </div>

        {/* Action strip: Export & Clear */}
        <div className="history-action-strip">
          <div className="export-buttons">
            <span className="export-label">내보내기:</span>
            <button
              type="button"
              className="strip-btn"
              onClick={() => onExport('txt')}
              disabled={records.length === 0}
              title="텍스트 파일(.txt)로 다운로드"
            >
              <Download size={13} />
              <span>TXT</span>
            </button>
            <button
              type="button"
              className="strip-btn"
              onClick={() => onExport('json')}
              disabled={records.length === 0}
              title="JSON 파일(.json)로 다운로드"
            >
              <Download size={13} />
              <span>JSON</span>
            </button>
          </div>

          <button
            type="button"
            className="strip-btn danger-text"
            onClick={onClearAll}
            disabled={records.length === 0}
            title="모든 번역 기록 삭제"
          >
            <Trash2 size={13} />
            <span>전체 비우기</span>
          </button>
        </div>

        {/* Card List Area */}
        <div className="history-scroll-area">
          {filtered.length > 0 ? (
            <div className="history-card-grid">
              {filtered.map((record) => (
                <HistoryCard
                  key={record.id}
                  record={record}
                  onToggleFavorite={onToggleFavorite}
                  onDelete={onDeleteRecord}
                  onSpeak={onSpeak}
                  onSelectRecord={onSelectRecord}
                />
              ))}
            </div>
          ) : (
            <div className="history-empty-state">
              <p className="empty-title">
                {searchQuery || onlyFavorites
                  ? '검색 조건에 맞는 기록이 없습니다.'
                  : '아직 번역 기록이 없습니다.'}
              </p>
              <p className="empty-sub">
                {searchQuery || onlyFavorites
                  ? '검색어나 필터를 재조정해 보세요.'
                  : '마이크로 말씀하시거나 영문을 입력하여 실시간 번역을 시작하세요.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
