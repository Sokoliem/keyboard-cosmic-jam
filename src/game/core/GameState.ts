import { EventEmitter } from '@utils/EventEmitter';

export interface Recording {
  id: string;
  timestamp: number;
  events: RecordingEvent[];
  duration: number;
}

export interface RecordingEvent {
  time: number;
  type: 'key' | 'touch';
  data: any;
}

export class GameState extends EventEmitter {
  private currentMode: 'menu' | 'story' | 'sandbox' = 'menu';
  private currentLevel: number = 0;
  private unlockedLevels: Set<number> = new Set([0]);
  private sessionStats = {
    keysPressed: 0,
    touchesRecorded: 0,
    soundsPlayed: 0,
    effectsTriggered: 0,
    sessionStartTime: Date.now(),
  };
  
  // Recording state
  private isRecording = false;
  private recordingStartTime = 0;
  private currentRecording: RecordingEvent[] = [];
  private recordings: Recording[] = [];
  
  // Settings
  private settings = {
    volume: 0.8,
    effectsEnabled: true,
    instrument: 'synth-bass',
    visualTheme: 'neon',
  };

  constructor() {
    super();
    this.loadState();
  }

  private loadState(): void {
    try {
      const saved = localStorage.getItem('cosmic-jam-state');
      if (saved) {
        const state = JSON.parse(saved);
        this.unlockedLevels = new Set(state.unlockedLevels || [0]);
        this.settings = { ...this.settings, ...state.settings };
        this.recordings = state.recordings || [];
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  }

  private saveState(): void {
    try {
      const state = {
        unlockedLevels: Array.from(this.unlockedLevels),
        settings: this.settings,
        recordings: this.recordings.slice(-5), // Keep last 5 recordings
      };
      localStorage.setItem('cosmic-jam-state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }

  public recordKeyPress(key: string): void {
    this.sessionStats.keysPressed++;
    
    if (this.isRecording) {
      this.currentRecording.push({
        time: Date.now() - this.recordingStartTime,
        type: 'key',
        data: { key },
      });
    }
    
    this.emit('keyPressed', key);
  }

  public recordTouch(touch: { x: number; y: number }): void {
    this.sessionStats.touchesRecorded++;
    
    if (this.isRecording) {
      this.currentRecording.push({
        time: Date.now() - this.recordingStartTime,
        type: 'touch',
        data: { touch },
      });
    }
    
    this.emit('touchRecorded', touch);
  }

  public addToRecording(soundData: any): void {
    this.sessionStats.soundsPlayed++;
    
    if (this.isRecording && soundData) {
      // Sound data is already captured with key/touch events
    }
  }

  public startRecording(): void {
    if (this.isRecording) return;
    
    this.isRecording = true;
    this.recordingStartTime = Date.now();
    this.currentRecording = [];
    
    this.emit('recordingStarted');
  }

  public stopRecording(): Recording | null {
    if (!this.isRecording) return null;
    
    this.isRecording = false;
    const duration = Date.now() - this.recordingStartTime;
    
    const recording: Recording = {
      id: `rec_${Date.now()}`,
      timestamp: this.recordingStartTime,
      events: this.currentRecording,
      duration,
    };
    
    this.recordings.push(recording);
    this.saveState();
    
    this.emit('recordingStopped', recording);
    return recording;
  }

  public playRecording(recordingId: string): void {
    const recording = this.recordings.find(r => r.id === recordingId);
    if (!recording) return;
    
    this.emit('playbackStarted', recording);
    
    // Schedule all events
    recording.events.forEach(event => {
      setTimeout(() => {
        if (event.type === 'key') {
          this.emit('playbackKey', event.data.key);
        } else if (event.type === 'touch') {
          this.emit('playbackTouch', event.data.touch);
        }
      }, event.time);
    });
    
    // Emit playback complete after duration
    setTimeout(() => {
      this.emit('playbackComplete', recording);
    }, recording.duration);
  }

  public setMode(mode: 'menu' | 'story' | 'sandbox'): void {
    this.currentMode = mode;
    this.emit('modeChanged', mode);
  }

  public setLevel(level: number): void {
    if (this.unlockedLevels.has(level)) {
      this.currentLevel = level;
      this.emit('levelChanged', level);
    }
  }

  public unlockLevel(level: number): void {
    if (!this.unlockedLevels.has(level)) {
      this.unlockedLevels.add(level);
      this.saveState();
      this.emit('levelUnlocked', level);
    }
  }

  public updateSettings(newSettings: Partial<typeof this.settings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveState();
    this.emit('settingsChanged', this.settings);
  }

  public getSettings() {
    return { ...this.settings };
  }

  public getSessionStats() {
    return {
      ...this.sessionStats,
      sessionDuration: Date.now() - this.sessionStats.sessionStartTime,
    };
  }

  public update(_deltaTime: number): void {
    // Update any time-based state here
  }

  public isRecordingActive(): boolean {
    return this.isRecording;
  }

  public getRecordings(): Recording[] {
    return [...this.recordings];
  }

  public getCurrentMode(): string {
    return this.currentMode;
  }

  public getCurrentLevel(): number {
    return this.currentLevel;
  }

  public getUnlockedLevels(): number[] {
    return Array.from(this.unlockedLevels);
  }
}