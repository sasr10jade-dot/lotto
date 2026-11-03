import React from 'react';
import { QuickPrompt, SupportedLang } from '../../types';

interface QuickChipsProps {
  sourceLang: SupportedLang;
  onSelectPrompt: (text: string) => void;
}

const SAMPLE_PROMPTS: QuickPrompt[] = [
  // English prompts
  {
    id: '1',
    category: 'business',
    label: '화면/음성 확인 (EN)',
    text: "Can everyone hear me clearly and see my shared screen?",
    lang: 'en',
  },
  {
    id: '2',
    category: 'business',
    label: '안건 진행 (EN)',
    text: "Let's move on to the next agenda item regarding the Q4 product roadmap.",
    lang: 'en',
  },
  {
    id: '3',
    category: 'business',
    label: '음성 끊김 재확인 (EN)',
    text: "Sorry, your voice was breaking up for a second. Could you repeat that last point?",
    lang: 'en',
  },
  {
    id: '4',
    category: 'business',
    label: '회의록 후속 조치 (EN)',
    text: "I'll follow up with the detailed action items and send over the summary email.",
    lang: 'en',
  },
  // Korean prompts
  {
    id: '5',
    category: 'business',
    label: '화면/음성 확인 (KO)',
    text: "제 목소리 잘 들리시나요? 화면 공유도 정상적으로 보이시는지 확인 부탁드립니다.",
    lang: 'ko',
  },
  {
    id: '6',
    category: 'business',
    label: '안건 진행 (KO)',
    text: "다음 안건인 신규 기능 개발 일정 및 배포 계획으로 넘어가겠습니다.",
    lang: 'ko',
  },
  {
    id: '7',
    category: 'business',
    label: '질문/피드백 (KO)',
    text: "이 부분에 대해 다른 의견이나 추가 질문 있으신 분 계신가요?",
    lang: 'ko',
  },
  {
    id: '8',
    category: 'business',
    label: '회의 마무리 (KO)',
    text: "오늘 회의 참석해 주셔서 감사합니다. 논의된 내용은 메일로 정리해서 공유하겠습니다.",
    lang: 'ko',
  },
];

export const QuickChips: React.FC<QuickChipsProps> = ({ sourceLang, onSelectPrompt }) => {
  const currentLang = sourceLang === 'ko' ? 'ko' : 'en';
  const displayedPrompts = SAMPLE_PROMPTS.filter((p) => sourceLang === 'auto' || p.lang === currentLang);

  return (
    <div className="quick-chips-container">
      <span className="chips-title">회의 예시:</span>
      <div className="chips-list">
        {displayedPrompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            className="chip-item"
            onClick={() => onSelectPrompt(prompt.text)}
            title={prompt.text}
          >
            {prompt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
