// Web Audio API: iPhone "Opening" / "Marimba" style ringtone

class RingtonePlayer {
  private audioCtx: AudioContext | null = null;
  private timer: number | null = null;
  private isPlaying = false;

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      this.audioCtx = new AudioContextClass();
    } catch (e) {
      console.warn("Could not create AudioContext for ringtone:", e);
      return;
    }

    // iPhone Opening/Marimba notes with timing (in seconds) and frequencies (in Hz)
    // Famous cheerful marimba arpeggio
    const melody: { f: number; t: number; dur?: number }[] = [
      // Phrase 1
      { f: 659.25, t: 0.00 }, // E5
      { f: 783.99, t: 0.12 }, // G5
      { f: 987.77, t: 0.24 }, // B5
      { f: 1318.51, t: 0.36 }, // E6
      { f: 987.77, t: 0.48 }, // B5
      { f: 783.99, t: 0.60 }, // G5
      // Short breath
      // Phrase 2
      { f: 880.00, t: 0.82 }, // A5
      { f: 1174.66, t: 0.94 }, // D6
      { f: 1479.98, t: 1.06 }, // F#6
      { f: 1174.66, t: 1.18 }, // D6
      { f: 880.00, t: 1.30 }, // A5
      // Phrase 3 cadence
      { f: 987.77, t: 1.50 }, // B5
      { f: 1318.51, t: 1.62 }, // E6
      { f: 1661.22, t: 1.74 }, // G#6
      { f: 1975.53, t: 1.90, dur: 0.35 }, // B6 (ring out)
    ];

    const playMarimbaNote = (freq: number, startTime: number, noteDur = 0.2) => {
      if (!this.audioCtx) return;

      // Primary tone: warm sine/triangle fundamental
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Mallet wooden bar strike: 4x harmonic with very fast decay
      const overtone = this.audioCtx.createOscillator();
      const overtoneGain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      overtone.type = "triangle";
      overtone.frequency.setValueAtTime(freq * 3.92, startTime);

      // Volume envelope for marimba bar: instant attack, exponential woody decay
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.24, startTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDur);

      // Mallet tick attack envelope
      overtoneGain.gain.setValueAtTime(0.0001, startTime);
      overtoneGain.gain.linearRampToValueAtTime(0.08, startTime + 0.003);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.05);

      osc.connect(gain);
      overtone.connect(overtoneGain);

      gain.connect(this.audioCtx.destination);
      overtoneGain.connect(this.audioCtx.destination);

      osc.start(startTime);
      overtone.start(startTime);

      osc.stop(startTime + noteDur + 0.05);
      overtone.stop(startTime + 0.08);
    };

    const playPattern = () => {
      if (!this.isPlaying || !this.audioCtx) return;

      if (this.audioCtx.state === "suspended") {
        void this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime + 0.05;

      for (const note of melody) {
        playMarimbaNote(note.f, now + note.t, note.dur ?? 0.22);
      }

      // Loop after 3.2 seconds
      this.timer = window.setTimeout(playPattern, 3200);
    };

    playPattern();
  }

  stop() {
    this.isPlaying = false;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.audioCtx) {
      void this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}

export const ringtone = new RingtonePlayer();
