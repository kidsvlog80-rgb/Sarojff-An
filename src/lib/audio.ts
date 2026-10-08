// Unified Immersive Digital Sound Synthesizer System
// Solves: Firefox/Chrome "Too many AudioContexts already active" and "Autoplay blocked" bugs.

let sharedAudioCtx: AudioContext | null = null;

// Lazily retrieve a single shared AudioContext
export const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        sharedAudioCtx = new AudioCtxClass();
      }
    }
    // Automatically try to resume if suspended (e.g. browser autoplay rules)
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {
        // Silent catch for initial blocked states
      });
    }
    return sharedAudioCtx;
  } catch (err) {
    console.warn('Unified audio context initialization failed:', err);
    return null;
  }
};

// Global event listener to unlock Web Audio API on first user interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        // Once unlocked successfully, remove listeners
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      }).catch(() => {});
    } else if (ctx && ctx.state === 'running') {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    }
  };

  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
}

// Unified beep synthesiser for UI feedback
export const playBeep = (frequency = 600, duration = 80, soundEnabled = true) => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') return;

  try {
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);

    // Warm, low-passed filter definition
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency * 1.5, now);

    // Prevent starting snap/click by using a quick but non-instant linear swell (7ms)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.75, now + 0.007); // Significantly increased gain from 0.22 to 0.75
    // Smoothly decay all the way to 0
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);

    oscillator.start(now);
    // Stop oscillator slightly after safety release threshold
    oscillator.stop(now + duration / 1000 + 0.05);
  } catch (e) {
    console.warn('Unified beep playback failed:', e);
  }
};

// Tactical premium micro-click for gorgeous UI feedback (combines clean physical tap with warm resonant chime decay)
export const playClickSound = (soundEnabled = true) => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') return;

  try {
    const now = ctx.currentTime;
    
    // 1. Warm Resonant Chime Voice (the smooth tail)
    const osc1 = ctx.createOscillator();
    const filter1 = ctx.createBiquadFilter();
    const gain1 = ctx.createGain();

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.type = 'sine';
    // Start at a pleasant frequency (A5 / 880Hz) and glide down slightly for warmth
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(440, now + 0.06);

    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(1200, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.28, now + 0.004); // soft, crisp start
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.08); // organic decay

    osc1.start(now);
    osc1.stop(now + 0.10);

    // 2. High-Frequency Tactile Click Transient (the crisp physical feeling)
    const osc2 = ctx.createOscillator();
    const filter2 = ctx.createBiquadFilter();
    const gain2 = ctx.createGain();

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(ctx.destination);

    // Triangle gives a clean woody/hollow transient
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2200, now);
    osc2.frequency.exponentialRampToValueAtTime(900, now + 0.02);

    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(2000, now);
    filter2.Q.setValueAtTime(3.0, now);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.38, now + 0.002); // sharp attack
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.012); // instant decay for crisp transient

    osc2.start(now);
    osc2.stop(now + 0.03);

  } catch (e) {
    console.warn('Unified click sound playback failed:', e);
  }
};

/**
 * Ultra-Thin & Smooth Premium "Mouse Click Close" sound.
 * Engineered for maximum professional elegance, delicate tactility, and precision:
 * 1. Micro-Switch Contact Tick: A crisp, thin bandpassed top-end noise burst at 8.5kHz (gain 0.22, 5ms) for a clean switch touch.
 * 2. Secondary Metal Leaf Spring: A subtle follower release clack at 6.8kHz after 11ms (gain 0.12, 4ms duration).
 * 3. Satin Core Resonance: A very clean, high-pitched, soft sine wave glide (3.2kHz down to 1.8kHz) at low amplitude (0.1) for a glassy, high-fidelity switch body response.
 */
export const playPremiumPortalClickSound = (soundEnabled = true) => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') return;

  try {
    const now = ctx.currentTime;

    // --- 1. MICRO-SWITCH CONTACT TICK (Crispy & Thin) ---
    const buffer1Size = ctx.sampleRate * 0.005; // Tight 5ms click
    const buffer1 = ctx.createBuffer(1, buffer1Size, ctx.sampleRate);
    const data1 = buffer1.getChannelData(0);
    for (let i = 0; i < buffer1Size; i++) {
      data1[i] = Math.random() * 2 - 1;
    }
    const noise1 = ctx.createBufferSource();
    noise1.buffer = buffer1;

    const noiseFilter1 = ctx.createBiquadFilter();
    noiseFilter1.type = 'bandpass';
    noiseFilter1.frequency.setValueAtTime(8500, now); // Pure high-frequency thin glass tick
    noiseFilter1.Q.setValueAtTime(6.0, now);

    const noiseGain1 = ctx.createGain();
    noiseGain1.gain.setValueAtTime(0, now);
    noiseGain1.gain.linearRampToValueAtTime(0.22, now + 0.0006); 
    noiseGain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.0045);

    noise1.connect(noiseFilter1);
    noiseFilter1.connect(noiseGain1);
    noiseGain1.connect(ctx.destination);
    noise1.start(now);
    noise1.stop(now + 0.006);

    // --- 2. SECONDARY METAL LEAF SPRING (Release Clack) ---
    const releaseTime = now + 0.010;
    const buffer2Size = ctx.sampleRate * 0.003; // Tight 3ms release rebound
    const buffer2 = ctx.createBuffer(1, buffer2Size, ctx.sampleRate);
    const data2 = buffer2.getChannelData(0);
    for (let i = 0; i < buffer2Size; i++) {
      data2[i] = Math.random() * 2 - 1;
    }
    const noise2 = ctx.createBufferSource();
    noise2.buffer = buffer2;

    const noiseFilter2 = ctx.createBiquadFilter();
    noiseFilter2.type = 'bandpass';
    noiseFilter2.frequency.setValueAtTime(6800, releaseTime); // High-pitched spring tick
    noiseFilter2.Q.setValueAtTime(5.0, releaseTime);

    const noiseGain2 = ctx.createGain();
    noiseGain2.gain.setValueAtTime(0, releaseTime);
    noiseGain2.gain.linearRampToValueAtTime(0.12, releaseTime + 0.0006);
    noiseGain2.gain.exponentialRampToValueAtTime(0.0001, releaseTime + 0.003);

    noise2.connect(noiseFilter2);
    noiseFilter2.connect(noiseGain2);
    noiseGain2.connect(ctx.destination);
    noise2.start(releaseTime);
    noise2.stop(releaseTime + 0.004);

    // --- 3. SATIN CORE RESONANCE (Glassy High-End Chasis Click) ---
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    const popFilter = ctx.createBiquadFilter();

    popOsc.connect(popFilter);
    popFilter.connect(popGain);
    popGain.connect(ctx.destination);

    // Sine wave is extremely smooth and removes any harsh boxiness
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(3200, now);
    popOsc.frequency.exponentialRampToValueAtTime(1800, now + 0.008); // High-frequency glide

    popFilter.type = 'lowpass';
    popFilter.frequency.setValueAtTime(4000, now);

    popGain.gain.setValueAtTime(0, now);
    popGain.gain.linearRampToValueAtTime(0.1, now + 0.0008);
    popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.010);

    popOsc.start(now);
    popOsc.stop(now + 0.012);

  } catch (e) {
    console.warn('Physical Mouse Click compilation failed:', e);
  }
};

// Styled sound triggers for AccessKey validation steps
export const playSynthesizerSound = (type: 'click' | 'error' | 'success', soundEnabled = true) => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') return;

  try {
    const now = ctx.currentTime;

    if (type === 'click') {
      playPremiumPortalClickSound(soundEnabled);
    } else if (type === 'error') {
      // Exact double-tone mechanical buzzer alert ("du-dup") as heard in the video at 0:13.
      // Replicates the precise, quick decay soft-warning tone.
      const frequencies = [200, 200]; // Low-pitched matching note
      frequencies.forEach((freq, idx) => {
        const noteTime = now + idx * 0.11; // 110ms spacing

        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Triangle wave with lowpass creates a warm woody cabinet buzz
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.88, noteTime + 0.06);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, noteTime);

        gainNode.gain.setValueAtTime(0, noteTime);
        gainNode.gain.linearRampToValueAtTime(0.48, noteTime + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.075); // fast decay (75ms) for a clean dry stop

        osc.start(noteTime);
        osc.stop(noteTime + 0.10);
      });
    } else if (type === 'success') {
      // Match the pristine digital "ti-ling" success tone
      const notes = [1567.98, 1975.53]; // G6, B6
      notes.forEach((freq, i) => {
        const noteDelay = i * 0.08; // 80ms delay
        const noteTime = now + noteDelay;

        const osc = ctx.createOscillator();
        const GainNode = ctx.createGain();

        osc.connect(GainNode);
        GainNode.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        GainNode.gain.setValueAtTime(0, noteTime);
        GainNode.gain.linearRampToValueAtTime(0.3, noteTime + 0.005);
        GainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.2);

        osc.start(noteTime);
        osc.stop(noteTime + 0.25);
      });
    }
  } catch (e) {
    console.warn('Synthesized key feedback sound failed:', e);
  }
};

// Immersive countdown audio with pitch tension gradient
export const playCountdownTickSound = (second: number, soundEnabled = true) => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') return;

  try {
    const now = ctx.currentTime;

    if (second === 0) {
      // Harmonious digital gate portal unlock bells
      const harmonics = [880, 1100, 1318.5]; // A5, C#6, E6
      harmonics.forEach((freq, idx) => {
        const noteTime = now + idx * 0.045;
        const osc = ctx.createOscillator();
        const backupOsc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();

        osc.connect(filter);
        backupOsc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        backupOsc.type = 'triangle';
        backupOsc.frequency.setValueAtTime(freq / 2, noteTime); // support node an octave below

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, noteTime);

        gainNode.gain.setValueAtTime(0, noteTime);
        gainNode.gain.linearRampToValueAtTime(idx === 0 ? 0.75 : 0.55, noteTime + 0.012); // Increased gain from 0.15/0.09 to 0.75/0.55
        gainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.35);

        osc.start(noteTime);
        backupOsc.start(noteTime);
        osc.stop(noteTime + 0.42);
        backupOsc.stop(noteTime + 0.42);
      });
    } else {
      // Tactile, smooth high-end heartbeat metronome tick
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      const pitch = 560 + (5 - second) * 85; // Clings seamlessly from 560Hz near start to 900Hz at finish

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.75, now + 0.08); // dynamic frequency roll-off to add punch

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.65, now + 0.003); // Increased metronome tick gain from 0.18 to 0.65
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.start(now);
      osc.stop(now + 0.11);
    }
  } catch (e) {
    console.warn('Countdown sound tick failed:', e);
  }
};

// Radiant success server boot sequence melody
export const playRadiantSuccessSound = (soundEnabled = true) => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') return;

  try {
    const now = ctx.currentTime;

    // Deep warm backing pads for incredible cinematic room acoustic presence
    const backupPads = [130.81, 196.00, 261.63]; // C3, G3, C4 chord
    backupPads.forEach((freq) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.45, now + 0.3); // Increased majestic volume from 0.05 to 0.45
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

      osc.start(now);
      osc.stop(now + 1.35);
    });

    // Elegant crystalline cascading star treble chime melody
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const noteDelay = idx * 0.065;
      const noteTime = now + noteDelay;

      const osc = ctx.createOscillator();
      const harmonicOsc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      osc.connect(filter);
      harmonicOsc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      harmonicOsc.type = 'sine';
      harmonicOsc.frequency.setValueAtTime(freq * 1.5, noteTime); // Adds structural resonance

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, noteTime);

      gainNode.gain.setValueAtTime(0, noteTime);
      gainNode.gain.linearRampToValueAtTime(0.70, noteTime + 0.015); // Increased chime melody volume from 0.09 to 0.70
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.42);

      osc.start(noteTime);
      harmonicOsc.start(noteTime);
      osc.stop(noteTime + 0.48);
      harmonicOsc.stop(noteTime + 0.48);
    });
  } catch (e) {
    console.warn('Radiant success sequence sound failed:', e);
  }
};

/**
 * Highly immersive, cinematic transition sound played when selecting timer modes.
 * Combines high-resolution harmonized chords, mechanical filters, and spatial sweeps.
 */
export const playTimerSelectTransition = (mode: '1min' | '30sec', soundEnabled = true) => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') return;

  try {
    const now = ctx.currentTime;

    if (mode === '1min') {
      // Majestic ascending crystalline strum for standard cycles
      // 1. Warm lush backing pads for spatial depth
      const pads = [130.81, 196.00, 261.63]; // C3, G3, C4
      pads.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.35 - (idx * 0.05), now + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

        osc.start(now);
        osc.stop(now + 1.7);
      });

      // 2. Clear major arpeggio cascade
      const chimeNotes = [329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // E4, G4, C5, E5, G5, C6
      chimeNotes.forEach((freq, idx) => {
        const delay = idx * 0.035;
        const noteTime = now + delay;

        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();

        osc.connect(filter);
        subOsc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(freq / 2, noteTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 1.8, noteTime);

        gainNode.gain.setValueAtTime(0, noteTime);
        gainNode.gain.linearRampToValueAtTime(0.55 - (idx * 0.03), noteTime + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.6);

        osc.start(noteTime);
        subOsc.start(noteTime);
        osc.stop(noteTime + 0.7);
        subOsc.stop(noteTime + 0.7);

        // Holographic digital reflections/echoes
        const echoTime = noteTime + 0.18;
        const echoOsc = ctx.createOscillator();
        const echoGain = ctx.createGain();

        echoOsc.connect(echoGain);
        echoGain.connect(ctx.destination);

        echoOsc.type = 'sine';
        echoOsc.frequency.setValueAtTime(freq, echoTime);
        
        echoGain.gain.setValueAtTime(0, echoTime);
        echoGain.gain.linearRampToValueAtTime(0.18, echoTime + 0.01);
        echoGain.gain.exponentialRampToValueAtTime(0.0001, echoTime + 0.4);

        echoOsc.start(echoTime);
        echoOsc.stop(echoTime + 0.45);
      });

    } else {
      // Hyper speed futuristic laser-double swipe for 30sec mode
      // 1. High energy sub-pressure kick and drone
      const subDrones = [98.00, 146.83, 196.00]; // G2, D3, G3
      subDrones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.28, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

        osc.start(now);
        osc.stop(now + 1.1);
      });

      // 2. Snappy lightning fast double lasers with pitch bend slide
      const slideNotes = [
        { start: 440, end: 880, delay: 0 },       // A4 -> A5 (Strike 1)
        { start: 783.99, end: 1567.98, delay: 0.06 }, // G5 -> G6 (Strike 2)
        { start: 1046.50, end: 2093, delay: 0.12 }   // C6 -> C7 (Strike 3)
      ];

      slideNotes.forEach((config) => {
        const noteTime = now + config.delay;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(config.start, noteTime);
        osc.frequency.exponentialRampToValueAtTime(config.end, noteTime + 0.14);

        // Resonant dynamic sweep filter
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(8, noteTime);
        filter.frequency.setValueAtTime(config.start * 1.5, noteTime);
        filter.frequency.exponentialRampToValueAtTime(config.end * 1.5, noteTime + 0.14);

        gainNode.gain.setValueAtTime(0, noteTime);
        gainNode.gain.linearRampToValueAtTime(0.65, noteTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.22);

        osc.start(noteTime);
        osc.stop(noteTime + 0.25);
      });

      // 3. Cybernetic high-frequency metallic splash / white noise burst mimicking speed charging
      const bufferSize = ctx.sampleRate * 0.12; // 120ms burst
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2000, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(8000, now + 0.12);
      noiseFilter.Q.setValueAtTime(3, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.12, now + 0.005);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 0.13);
    }
  } catch (err) {
    console.warn('playTimerSelectTransition execution failed:', err);
  }
};

let scanOsc: OscillatorNode | null = null;
let scanGain: GainNode | null = null;
let scanClicksInterval: any = null;

export const playFingerprintScanning = (soundEnabled = true) => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  try {
    const now = ctx.currentTime;
    
    // Stop any existing scanning sound
    stopFingerprintScanning();
    
    // Create oscillator with ascending frequency for laser/electric charging feel
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(800, now + 2.5); // ascends over 2.5 seconds
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 2.5);
    filter.Q.setValueAtTime(4, now);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
    
    osc.start(now);
    
    scanOsc = osc;
    scanGain = gainNode;
    
    // Create periodic scientific "tick-tick" clicks representing scanning laser passes
    let clickCount = 0;
    scanClicksInterval = setInterval(() => {
      clickCount++;
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      
      clickOsc.type = 'sine';
      clickOsc.frequency.setValueAtTime(2000 + (clickCount * 150), ctx.currentTime);
      
      clickGain.gain.setValueAtTime(0, ctx.currentTime);
      clickGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.002);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      
      clickOsc.start();
      clickOsc.stop(ctx.currentTime + 0.05);
    }, 150);
    
  } catch (err) {
    console.warn('Fingerprint scanning sound failed:', err);
  }
};

export const stopFingerprintScanning = () => {
  if (scanOsc) {
    try {
      scanOsc.stop();
    } catch {}
    scanOsc = null;
  }
  if (scanGain) {
    scanGain = null;
  }
  if (scanClicksInterval) {
    clearInterval(scanClicksInterval);
    scanClicksInterval = null;
  }
};

export const playFingerprintSuccess = (soundEnabled = true) => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    
    // Exact digital completion chime "ti-ling!" ascending high-pitched signature.
    // Tone 1: High crisp G6 sine wave starting immediately
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1567.98, now); // G6 note
    osc1.frequency.exponentialRampToValueAtTime(1567.98, now + 0.15); // Pure pristine hold
    
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.32, now + 0.005); // quick smooth attack
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18); // short smooth decay
    
    // Tone 2: Harmonious high-pitched crystal glint (B6) starting exactly 80ms later for the satisfying "ling!"
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    const delay = 0.08; // 80ms delay
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1975.53, now + delay); // B6 note
    
    gain2.gain.setValueAtTime(0, now + delay);
    gain2.gain.linearRampToValueAtTime(0.24, now + delay + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.22);
    
    // Soft underbelly sub-sine wave weight to emulate a haptic physical tap completion
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(150, now);
    subOsc.frequency.exponentialRampToValueAtTime(75, now + 0.12);
    
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.18, now + 0.008);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    
    osc1.start(now);
    subOsc.start(now);
    osc2.start(now + delay);
    
    osc1.stop(now + 0.22);
    subOsc.stop(now + 0.2);
    osc2.stop(now + delay + 0.28);
    
  } catch (err) {
    console.warn('Fingerprint success sound play failed:', err);
  }
};

/**
 * Gentle, soft unlock sound chime.
 * Plays only after fingerprint scan reaches 100%.
 * Very soft, pleasant, and subtle ("ek halka sa sound") without loud or harsh buzz.
 */
export const playFingerprintGentleUnlock = (soundEnabled = true) => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  try {
    const now = ctx.currentTime;

    // Primary Tone: C6 (1046.5 Hz) soft sine chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const filter1 = ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now);

    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(2200, now);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ctx.destination);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.09, now + 0.012);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc1.start(now);
    osc1.stop(now + 0.28);

    // Secondary Tone: E6 (1318.5 Hz) soft harmonic chime (delayed by 60ms)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const filter2 = ctx.createBiquadFilter();

    const delay = 0.06;
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + delay);

    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(2400, now + delay);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(ctx.destination);

    gain2.gain.setValueAtTime(0, now + delay);
    gain2.gain.linearRampToValueAtTime(0.07, now + delay + 0.012);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.3);

    osc2.start(now + delay);
    osc2.stop(now + delay + 0.32);

  } catch (err) {
    console.warn('Fingerprint gentle unlock sound failed:', err);
  }
};

export const playFingerprintDenied = (soundEnabled = true) => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    
    // Soft physical haptic failure buzzer (bap-bap dual decay)
    const notes = [160, 140];
    notes.forEach((freq, idx) => {
      const noteDelay = idx * 0.09;
      const t = now + noteDelay;
      
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();
      
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, t);
      
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.35, t + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      
      osc.start(t);
      osc.stop(t + 0.11);
    });
    
  } catch (err) {
    console.warn('Fingerprint denied sound play failed:', err);
  }
};

/**
 * Highly polished, ultra-subtle digital scanner blip that scales gracefully.
 */
export const playScanTickSound = (progress: number, soundEnabled = true) => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    // Let the pitch rise elegantly with progress but keep it pure and soft
    const startFreq = 800 + (progress * 4); 
    osc.frequency.setValueAtTime(startFreq, now);

    gainNode.gain.setValueAtTime(0, now);
    // Extremely subtle, low volume click/blip
    gainNode.gain.linearRampToValueAtTime(0.06, now + 0.003);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {
    console.warn('Scan tick sound failed:', e);
  }
};

/**
 * Gorgeous, warm, high-end science-fiction success bell chime with backing pads
 * that sounds premium and comfortable instead of a generic raw beep.
 */
export const playPredictionSuccessSound = (soundEnabled = true) => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') return;

  try {
    const now = ctx.currentTime;

    // 1. Gentle warm under-tone base chord (soft triangle, lowpass)
    const pads = [261.63, 329.63, 392.00]; // C4, E4, G4 (C Major)
    pads.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.18 - (idx * 0.03), now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.start(now);
      osc.stop(now + 1.3);
    });

    // 2. High sweet crystalline chime notes (sine, quick rise, elegant tail)
    // C5, E5, G5, C6, E6 arpeggio
    const chimes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chimes.forEach((freq, idx) => {
      const delay = idx * 0.07;
      const t = now + delay;

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      // Subtle pitch lift on release for beautiful sci-fi sparkle
      osc.frequency.exponentialRampToValueAtTime(freq * 1.005, t + 0.6);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, t);

      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.22 - (idx * 0.03), t + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);

      osc.start(t);
      osc.stop(t + 0.9);
    });
  } catch (e) {
    console.warn('Prediction success sound failed:', e);
  }
};
