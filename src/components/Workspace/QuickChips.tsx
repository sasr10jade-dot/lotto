import React from 'react';
import { QuickPrompt } from '../../types';

interface QuickChipsProps {
  onSelectPrompt: (text: string) => void;
}

const SAMPLE_PROMPTS: QuickPrompt[] = [
  {
    id: '1',
    category: 'business',
    label: '화면/음성 확인',
    text: "Can everyone hear me clearly and see my shared screen?",
  },
  {
    id: '2',
    category: 'business',
    label: '안건 진행',
    text: "Let's move on to the next agenda item regarding the Q4 product roadmap.",
  },
  {
    id: '3',
    category: 'business',
    label: '음성 끊김/다시 묻기',
    text: "Sorry, your voice was breaking up for a second. Could you repeat that last point?",
  },
  {
    id: '4',
    category: 'business',
    label: '회의록 후속 조치',
    text: "I'll follow up with the detailed action items and send over the summary email.",
  },
  {
    id: '5',
    category: 'daily',
    label: '회의 마무리',
    text: "Thank you all for taking the time to join today's sync. Have a great rest of your day!",
  },
];

export const QuickChips: React.FC<QuickChipsProps> = ({ onSelectPrompt }) => {
  return (
    <div className="quick-chips-container">
      <span className="chips-title">빠른 예시:</span>
      <div className="chips-list">
        {SAMPLE_PROMPTS.map((prompt) => (
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
