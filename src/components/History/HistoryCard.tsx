import React, { useState } from 'react';
import { Star, Volume2, Copy, Check, Trash2, Mic, FileText } from 'lucide-react';
import { TranslationRecord } from '../../types';

interface HistoryCardProps {
  record: TranslationRecord;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onSpeak: (text: string) => void;
  onSelectRecord: (record: TranslationRecord) => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  record,
  onToggleFavorite,
  onDelete,
  onSpeak,
  onSelectRecord,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${record.sourceText}\n➔ ${record.translatedText}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      //
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`history-card ${record.isFavorite ? 'favorite' : ''}`}
      onClick={() => onSelectRecord(record)}
      title="클릭하여 워크스페이스에 불러오기"
    >
      <div className="card-top">
        <div className="card-meta">
          <span className="card-type-pill">
            {record.sourceType === 'mic' ? <Mic size={11} /> : <FileText size={11} />}
            <span>{record.sourceType === 'mic' ? '음성' : '텍스트'}</span>
          </span>
          <span className="card-engine-pill">{record.engine}</span>
          <span className="card-time">{formatTime(record.timestamp)}</span>
        </div>

        <div className="card-actions">
          <button
            type="button"
            className="card-action-btn star-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(record.id);
            }}
            title={record.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            <Star
              size={14}
              className={record.isFavorite ? 'filled-star' : ''}
              fill={record.isFavorite ? '#f59e0b' : 'none'}
            />
          </button>

          <button
            type="button"
            className="card-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSpeak(record.translatedText);
            }}
            title="한국어 발음 듣기"
          >
            <Volume2 size={14} />
          </button>

          <button
            type="button"
            className="card-action-btn"
            onClick={handleCopy}
            title="영문/한글 쌍 복사"
          >
            {copied ? <Check size={14} className="copied-icon" /> : <Copy size={14} />}
          </button>

          <button
            type="button"
            className="card-action-btn delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(record.id);
            }}
            title="기록 삭제"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="card-content">
        <p className="card-source-text">{record.sourceText}</p>
        <p className="card-target-text">{record.translatedText}</p>
      </div>
    </div>
  );
};
