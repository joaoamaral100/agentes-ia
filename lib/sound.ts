export function playBeep(frequency: number, durationMs: number, volume = 0.05) {
  if (typeof window === "undefined") return;
  try {
    const AC = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC() as AudioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
    osc.onended = () => { try { ctx.close(); } catch {} };
  } catch {}
}

export const beepSend    = () => playBeep(880,  50,  0.05);
export const beepReceive = () => playBeep(1200, 100, 0.04);
