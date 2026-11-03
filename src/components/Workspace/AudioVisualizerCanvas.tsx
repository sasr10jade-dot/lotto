import React, { useEffect, useRef } from 'react';
import { AudioVisualizerService } from '../../services/audioVisualizer';

interface AudioVisualizerCanvasProps {
  visualizerService: AudioVisualizerService;
  isListening: boolean;
  volume: number;
  onVolumeChange?: (volume: number) => void;
}

export const AudioVisualizerCanvas: React.FC<AudioVisualizerCanvasProps> = ({
  visualizerService,
  isListening,
  volume,
  onVolumeChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      visualizerService.attachCanvas(canvasRef.current, onVolumeChange);
    }
  }, [visualizerService, onVolumeChange]);

  return (
    <div className={`visualizer-box ${isListening ? 'listening' : ''}`}>
      <canvas
        ref={canvasRef}
        width={340}
        height={48}
        className="visualizer-canvas"
      />
      <div className="visualizer-info">
        <span className="vol-text">
          {isListening ? (volume > 0 ? `음성 감지: ${volume}%` : '말씀해 주세요...') : '마이크 꺼짐'}
        </span>
      </div>
    </div>
  );
};
