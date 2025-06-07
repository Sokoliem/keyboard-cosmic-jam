import { EventEmitter } from '@utils/EventEmitter';
import { 
  getKeyMapping, 
  getFrequency, 
  INSTRUMENTS, 
  DRUM_FREQUENCIES,
  type InstrumentConfig 
} from '@game/data/KeyMappings';

export interface SoundConfig {
  key: string;
  instrument: string;
  note: string;
  octave: number;
  frequency: number;
  volume: number;
  duration: number;
  color: string;
}

export class AudioEngine extends EventEmitter {
  private context: AudioContext | null = null;
  private masterVolume = 0.8;
  private isInitialized = false;
  private currentInstrument: string | null = null;

  constructor() {
    super();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Don't create AudioContext until first user interaction
    // This prevents the autoplay policy error
    this.isInitialized = true;
    this.emit('initialized');
  }

  private async ensureAudioContext(): Promise<void> {
    if (this.context) return;

    try {
      // Create audio context on first use (after user gesture)
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (iOS requirement)
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      this.emit('audioContextReady');
    } catch (error) {
      console.error('Failed to create audio context:', error);
      throw error;
    }
  }

  public async playKeySound(key: string): Promise<SoundConfig | null> {
    if (!this.isInitialized) return null;

    await this.ensureAudioContext();
    if (!this.context) return null;

    // Get key mapping
    const mapping = getKeyMapping(key);
    if (!mapping) return null;

    // Use current instrument override if set, otherwise use mapping
    const instrument = this.currentInstrument || mapping.instrument;

    // Calculate frequency
    let frequency: number;
    if (instrument === 'digitalDrum') {
      frequency = DRUM_FREQUENCIES[mapping.note] || 200;
    } else {
      frequency = getFrequency(mapping.note, mapping.octave);
    }

    const sound: SoundConfig = {
      key: mapping.key,
      instrument: instrument,
      note: mapping.note,
      octave: mapping.octave,
      frequency,
      volume: this.masterVolume,
      duration: 0.5, // Default duration
      color: mapping.color
    };

    this.playSound(sound);
    return sound;
  }

  public async playZoneSound(zone: any): Promise<SoundConfig | null> {
    if (!this.isInitialized) return null;

    await this.ensureAudioContext();
    if (!this.context) return null;

    // Use the first key from the zone for sound mapping
    const key = zone.keys?.[0];
    if (!key) return null;

    return this.playKeySound(key);
  }

  private playSound(config: SoundConfig): void {
    if (!this.context) return;

    const instrument = INSTRUMENTS[config.instrument];
    if (!instrument) {
      console.warn(`Unknown instrument: ${config.instrument}`);
      return;
    }

    try {
      switch (instrument.type) {
        case 'synth':
          this.playSynthSound(config, instrument);
          break;
        case 'fm':
          this.playFMSound(config, instrument);
          break;
        case 'noise':
          this.playNoiseSound(config, instrument);
          break;
        default:
          this.playSynthSound(config, instrument);
      }

      this.emit('soundPlayed', config);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  private playSynthSound(config: SoundConfig, instrument: InstrumentConfig): void {
    if (!this.context) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filterNode = this.context.createBiquadFilter();

    // Setup signal chain
    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.context.destination);

    // Configure oscillator
    oscillator.type = instrument.waveform || 'sine';
    oscillator.frequency.value = config.frequency;

    // Configure filter for warmth
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 2000;
    filterNode.Q.value = 1;

    // ADSR envelope
    const now = this.context.currentTime;
    const attack = instrument.attack || 0.01;
    const decay = instrument.decay || 0.1;
    const sustain = instrument.sustain || 0.5;
    const release = instrument.release || 0.3;
    const totalDuration = config.duration;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(config.volume, now + attack);
    gainNode.gain.linearRampToValueAtTime(config.volume * sustain, now + attack + decay);
    gainNode.gain.setValueAtTime(config.volume * sustain, now + totalDuration - release);
    gainNode.gain.linearRampToValueAtTime(0, now + totalDuration);

    // Start and stop
    oscillator.start(now);
    oscillator.stop(now + totalDuration);
  }

  private playFMSound(config: SoundConfig, instrument: InstrumentConfig): void {
    if (!this.context) return;

    // FM synthesis: carrier + modulator
    const carrier = this.context.createOscillator();
    const modulator = this.context.createOscillator();
    const modGain = this.context.createGain();
    const outputGain = this.context.createGain();

    // Setup FM signal chain
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(outputGain);
    outputGain.connect(this.context.destination);

    // Configure FM parameters
    carrier.frequency.value = config.frequency;
    modulator.frequency.value = config.frequency * (instrument.modulation?.frequency || 2);
    modGain.gain.value = config.frequency * (instrument.modulation?.depth || 0.5);

    // Envelope
    const now = this.context.currentTime;
    const attack = instrument.attack || 0.01;
    const decay = instrument.decay || 0.8;
    const release = instrument.release || 1.0;
    const totalDuration = config.duration;

    outputGain.gain.setValueAtTime(0, now);
    outputGain.gain.linearRampToValueAtTime(config.volume, now + attack);
    outputGain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);
    outputGain.gain.setValueAtTime(0.001, now + totalDuration - release);
    outputGain.gain.exponentialRampToValueAtTime(0.0001, now + totalDuration);

    // Start and stop
    carrier.start(now);
    modulator.start(now);
    carrier.stop(now + totalDuration);
    modulator.stop(now + totalDuration);
  }

  private playNoiseSound(config: SoundConfig, instrument: InstrumentConfig): void {
    if (!this.context) return;

    // Create noise buffer
    const bufferSize = this.context.sampleRate * 0.1; // 100ms of noise
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate noise
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.context.createBufferSource();
    const filterNode = this.context.createBiquadFilter();
    const gainNode = this.context.createGain();

    noise.buffer = buffer;
    noise.loop = true;

    // Setup signal chain
    noise.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.context.destination);

    // Configure filter based on drum type
    const freq = config.frequency;
    if (freq < 100) {
      // Kick drum - low pass
      filterNode.type = 'lowpass';
      filterNode.frequency.value = 100;
      filterNode.Q.value = 5;
    } else if (freq > 1000) {
      // Hi-hat - high pass
      filterNode.type = 'highpass';
      filterNode.frequency.value = 1000;
      filterNode.Q.value = 2;
    } else {
      // Snare - band pass
      filterNode.type = 'bandpass';
      filterNode.frequency.value = freq;
      filterNode.Q.value = 10;
    }

    // Sharp envelope for drums
    const now = this.context.currentTime;
    const attack = instrument.attack || 0.001;
    const decay = instrument.decay || 0.1;
    const totalDuration = Math.min(config.duration, 0.5); // Max 500ms for drums

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(config.volume, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);

    // Start and stop
    noise.start(now);
    noise.stop(now + totalDuration);
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.emit('volumeChanged', this.masterVolume);
  }

  public setCurrentInstrument(instrument: string | null): void {
    this.currentInstrument = instrument;
    this.emit('instrumentChanged', instrument);
  }

  public getCurrentInstrument(): string | null {
    return this.currentInstrument;
  }

  public update(_deltaTime: number): void {
    // Update any time-based audio effects
  }

  public cleanup(): void {
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    this.isInitialized = false;
  }
}