export class AudioVisualizerService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private isRunning = false;
  private onVolumeChange?: (volume: number) => void;

  public attachCanvas(canvas: HTMLCanvasElement, onVolumeChange?: (vol: number) => void) {
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext('2d');
    this.onVolumeChange = onVolumeChange;
    this.drawIdle();
  }

  public async start(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyser);

      this.isRunning = true;
      this.render();
      return true;
    } catch {
      this.drawIdle();
      return false;
    }
  }

  public stop() {
    this.isRunning = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.drawIdle();
    if (this.onVolumeChange) {
      this.onVolumeChange(0);
    }
  }

  private render = () => {
    if (!this.isRunning || !this.analyser || !this.canvas || !this.canvasCtx) {
      return;
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const avg = sum / bufferLength;
    const volumePct = Math.min(100, Math.round((avg / 128) * 100));
    if (this.onVolumeChange) {
      this.onVolumeChange(volumePct);
    }

    const ctx = this.canvasCtx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Neon Gradient Wave bars
    const barCount = 36;
    const barWidth = Math.max(2, (width / barCount) - 3);
    const step = Math.floor(bufferLength / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step] || 0;
      const percent = value / 255;
      const barHeight = Math.max(4, percent * height * 0.85);
      const x = i * (barWidth + 3) + 4;
      const y = (height - barHeight) / 2;

      // Dynamic glowing gradient
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#06b6d4'); // Cyan top
      gradient.addColorStop(0.5, '#6366f1'); // Indigo center
      gradient.addColorStop(1, '#a855f7'); // Purple bottom

      ctx.fillStyle = gradient;
      ctx.shadowBlur = Math.min(12, percent * 18);
      ctx.shadowColor = '#6366f1';

      // Rounded rectangle bar
      ctx.beginPath();
      const radius = barWidth / 2;
      ctx.roundRect(x, y, barWidth, barHeight, radius);
      ctx.fill();
    }

    this.animationFrameId = requestAnimationFrame(this.render);
  };

  public drawIdle() {
    if (!this.canvas || !this.canvasCtx) return;
    const ctx = this.canvasCtx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.shadowBlur = 0;

    // Subtly breathing idle flat bars
    const barCount = 36;
    const barWidth = Math.max(2, (width / barCount) - 3);

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + 3) + 4;
      const barHeight = 4;
      const y = (height - barHeight) / 2;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }
  }
}
