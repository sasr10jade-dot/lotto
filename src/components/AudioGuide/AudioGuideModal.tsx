import React from 'react';
import { X, Headphones, Mic, CheckCircle2, AlertTriangle } from 'lucide-react';
import './AudioGuideModal.css';

interface AudioGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioGuideModal: React.FC<AudioGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog audio-guide-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Headphones size={20} className="modal-icon" />
            <h3 className="modal-title">화상 회의 상대방 음성 캡처 가이드</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="guide-intro">
            화상 회의(Zoom, Google Meet, Teams)에서 <strong>상대방이 말하는 영어 음성</strong>을 실시간 번역기에 입력하는 가장 확실한 2가지 방법입니다.
          </p>

          {/* Method 1: Stereo Mix */}
          <div className="guide-card recommended">
            <div className="guide-card-header">
              <span className="method-badge">방법 1 (가장 추천 - Zoom/Teams 앱용)</span>
              <h4 className="guide-card-title">Windows 스테레오 믹스 (Stereo Mix) 활성화</h4>
            </div>
            <p className="guide-desc">
              컴퓨터 스피커에서 나오는 상대방의 목소리를 번역기 마이크 입력으로 바로 연결합니다.
            </p>
            <ol className="step-list">
              <li>
                <CheckCircle2 size={14} className="step-icon" />
                <span>작업표시줄 우측 하단 <strong>스피커 아이콘 우클릭 ➔ '소리 설정'</strong> 이동</span>
              </li>
              <li>
                <CheckCircle2 size={14} className="step-icon" />
                <span>입력 장치에서 <strong>'스테레오 믹스(Stereo Mix)'</strong>를 활성화하고 기본 장치로 설정</span>
              </li>
              <li>
                <CheckCircle2 size={14} className="step-icon" />
                <span>LiveLingua KR 화면에서 <strong>[마이크 켜기]</strong>를 누르면 상대방 목소리가 즉시 번역됩니다!</span>
              </li>
            </ol>
          </div>

          {/* Method 2: Web Google Meet Tab audio */}
          <div className="guide-card">
            <div className="guide-card-header">
              <span className="method-badge neutral">방법 2 (무설치 - Google Meet / 웹 회의)</span>
              <h4 className="guide-card-title">Chrome 탭 / 스피커 소리 공유</h4>
            </div>
            <p className="guide-desc">
              Google Meet을 웹 브라우저 탭으로 열어 회의를 진행하고, 이어폰 대신 스피커로 소리를 켜두면 내 마이크가 상대방 목소리를 자연스럽게 수음하여 번역합니다.
            </p>
          </div>

          <div className="guide-tip-box">
            <AlertTriangle size={16} className="tip-icon" />
            <p className="tip-text">
              <strong>Tip:</strong> 내가 영어로 말할 때는 일반 <strong>헤드셋 마이크</strong>로, 외국인 동료가 영어로 회의를 진행할 때는 <strong>스테레오 믹스</strong>로 소스 장치를 선택하시면 끊김 없이 번역됩니다.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-btn primary" onClick={onClose}>
            <Mic size={15} />
            <span>확인했습니다</span>
          </button>
        </div>
      </div>
    </div>
  );
};
