/**
 * AudioEngine — Sound architecture stub for FCAI-Visualizer.
 *
 * Architecture:
 *   audioEngine.enable()        → creates an AudioContext (requires user gesture first)
 *   audioEngine.disable()       → suspends the context
 *   audioEngine.playTone(value) → fires a short sine-wave beep pitched to the bar value
 *
 * The pitch mapping is: value (1–100) → frequency (150–1200 Hz) linearly.
 * This produces the classic "sorting sound" where taller bars = higher pitch.
 *
 * Usage (future Phase 4):
 *   import { audioEngine } from '../audio/audioEngine';
 *   // in sortingVisualizer.js, inside animateStep():
 *   if (audioEngine.enabled) audioEngine.playTone(step.arr[swapIdx]);
 *
 * NOT yet connected to the UI — the architecture is ready, just not wired.
 */
export class AudioEngine {
  constructor() {
    this._ctx = null;
    this._enabled = false;
    this._masterGain = null;
  }

  get enabled() {
    return this._enabled;
  }

  /** Call this on a user click/toggle to initialise the AudioContext. */
  enable() {
    if (this._ctx) {
      this._ctx.resume();
      this._enabled = true;
      return;
    }
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = 0.12; // quiet by default
      this._masterGain.connect(this._ctx.destination);
      this._enabled = true;
    } catch (err) {
      console.warn('[AudioEngine] Web Audio API not available:', err);
      this._enabled = false;
    }
  }

  /** Suspend the AudioContext to stop all sound output. */
  disable() {
    this._enabled = false;
    this._ctx?.suspend();
  }

  /**
   * Play a short sine-wave beep proportional to the bar's value.
   * @param {number} value      - element value (typically 1–100)
   * @param {number} minVal     - domain minimum (default 1)
   * @param {number} maxVal     - domain maximum (default 100)
   * @param {number} durationMs - beep length in milliseconds (default 80)
   */
  playTone(value, minVal = 1, maxVal = 100, durationMs = 80) {
    if (!this._enabled || !this._ctx) return;

    const MIN_FREQ = 150;
    const MAX_FREQ = 1200;
    const t = Math.max(0, Math.min(1, (value - minVal) / (maxVal - minVal)));
    const frequency = MIN_FREQ + t * (MAX_FREQ - MIN_FREQ);

    const now = this._ctx.currentTime;
    const dur = durationMs / 1000;

    const osc = this._ctx.createOscillator();
    const env = this._ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);

    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(1, now + 0.005);        // 5ms attack
    env.gain.exponentialRampToValueAtTime(0.001, now + dur); // decay

    osc.connect(env);
    env.connect(this._masterGain);

    osc.start(now);
    osc.stop(now + dur);
  }
}

/** Singleton — import this everywhere instead of constructing a new instance. */
export const audioEngine = new AudioEngine();
