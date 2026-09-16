/**
 * Procedural Web Audio Synthesizer for Hookah Lounge
 * 100% self-contained, no external audio file dependencies.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientOscs: OscillatorNode[] = [];
  private ambientGain: GainNode | null = null;
  private bubblingNode: { stop: () => void } | null = null;
  private isAmbientPlaying: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.04, this.ctx?.currentTime || 0);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Sound effect when the pipe is grabbed
   */
  public playGrab() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Procedural hookah water bubbling sound while inhaling
   */
  public startBubbling() {
    if (this.isMuted || this.bubblingNode) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // Create noise buffer for bubbling water percolation
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Resonant bandpass filter modulated to mimic water bubbles
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);
    filter.Q.setValueAtTime(8.0, ctx.currentTime);

    // LFO for bubbly modulation
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(12, ctx.currentTime); // 12Hz bubble rate

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(250, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Secondary sub-bass air suction
    const subOsc = ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(85, ctx.currentTime);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.06, ctx.currentTime);
    subOsc.connect(subGain);
    subGain.connect(masterGain);

    whiteNoise.connect(filter);
    filter.connect(masterGain);

    whiteNoise.start();
    lfo.start();
    subOsc.start();

    this.bubblingNode = {
      stop: () => {
        const stopTime = ctx.currentTime + 0.15;
        masterGain.gain.exponentialRampToValueAtTime(0.001, stopTime);
        setTimeout(() => {
          try {
            whiteNoise.stop();
            lfo.stop();
            subOsc.stop();
          } catch {
            // Already stopped
          }
        }, 200);
      },
    };
  }

  public stopBubbling() {
    if (this.bubblingNode) {
      this.bubblingNode.stop();
      this.bubblingNode = null;
    }
  }

  /**
   * Sound effect when user blows out smoke
   */
  public playExhale() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 1.5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 1.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 1.3);
  }

  /**
   * Ambient chill lounge background drone pad
   */
  public startAmbientPad() {
    if (this.isAmbientPlaying || this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [130.81, 155.56, 196.0, 233.08]; // C minor 7 chord frequencies
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.035, this.ctx.currentTime);
    this.ambientGain.connect(this.ctx.destination);

    this.ambientOscs = notes.map((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (i * 0.3), this.ctx!.currentTime); // subtle detune
      osc.connect(this.ambientGain!);
      osc.start();
      return osc;
    });

    this.isAmbientPlaying = true;
  }

  public stopAmbientPad() {
    this.ambientOscs.forEach(osc => {
      try {
        osc.stop();
      } catch {
        // already stopped
      }
    });
    this.ambientOscs = [];
    this.isAmbientPlaying = false;
  }
}

export const soundManager = new SoundSystem();
