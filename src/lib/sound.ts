// Tiny Web Audio cues for answers. No audio files, works offline.
let ctx: AudioContext | null = null;

function tone(freq: number, start: number, duration: number, gain = 0.06) {
  ctx ??= new AudioContext();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration);
}

export function playCue(kind: 'correct' | 'wrong', enabled: boolean) {
  if (!enabled || typeof AudioContext === 'undefined') return;
  try {
    if (kind === 'correct') {
      tone(660, 0, 0.12);
      tone(990, 0.1, 0.18);
    } else {
      tone(220, 0, 0.22, 0.05);
    }
  } catch {
    // Audio is a nicety; ignore autoplay or device errors.
  }
}
