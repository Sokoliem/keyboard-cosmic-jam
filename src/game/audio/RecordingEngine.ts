import { EventEmitter } from '@utils/EventEmitter';
import { SoundConfig } from './AudioEngine';

export interface RecordedNote {
  timestamp: number;       // When the note was played (relative to recording start)
  key: string;            // Which key was pressed
  soundConfig: SoundConfig; // The sound that was played
  duration: number;       // How long the note lasted
}

export interface Recording {
  id: string;
  name: string;
  timestamp: number;      // When recording was created
  duration: number;       // Total recording length
  notes: RecordedNote[];
  bpm?: number;          // Detected or set tempo
  metadata?: {
    keyCount: number;
    instrumentsUsed: string[];
    avgNotesPerSecond: number;
  };
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  recording: Recording | null;
  playbackSpeed: number;
}

export class RecordingEngine extends EventEmitter {
  private isRecording = false;
  private isPaused = false;
  private isPlaying = false;
  
  private currentRecording: Recording | null = null;
  private recordingStartTime = 0;
  private recordingNotes: RecordedNote[] = [];
  private activeNotes: Map<string, number> = new Map(); // key -> start timestamp
  
  private playbackState: PlaybackState = {
    isPlaying: false,
    currentTime: 0,
    totalDuration: 0,
    recording: null,
    playbackSpeed: 1.0
  };
  
  private playbackStartTime = 0;
  private playbackTimeoutIds: number[] = [];
  private recordings: Map<string, Recording> = new Map();

  // Maximum recording duration (10 minutes)
  private readonly MAX_RECORDING_DURATION = 10 * 60 * 1000;

  constructor() {
    super();
    this.loadStoredRecordings();
  }

  // Recording Methods
  public startRecording(name?: string): boolean {
    if (this.isRecording || this.isPlaying) {
      return false;
    }

    this.isRecording = true;
    this.isPaused = false;
    this.recordingStartTime = performance.now();
    this.recordingNotes = [];
    this.activeNotes.clear();

    this.currentRecording = {
      id: this.generateId(),
      name: name || `Recording ${Date.now()}`,
      timestamp: Date.now(),
      duration: 0,
      notes: [],
      metadata: {
        keyCount: 0,
        instrumentsUsed: [],
        avgNotesPerSecond: 0
      }
    };

    this.emit('recordingStarted', this.currentRecording);
    return true;
  }

  public pauseRecording(): boolean {
    if (!this.isRecording || this.isPaused) {
      return false;
    }

    this.isPaused = true;
    // Finish any active notes
    this.finishActiveNotes();
    this.emit('recordingPaused');
    return true;
  }

  public resumeRecording(): boolean {
    if (!this.isRecording || !this.isPaused) {
      return false;
    }

    this.isPaused = false;
    // Adjust start time to account for pause
    const pauseDuration = performance.now() - this.recordingStartTime;
    this.recordingStartTime = performance.now() - (this.getTotalRecordingDuration() - pauseDuration);
    
    this.emit('recordingResumed');
    return true;
  }

  public stopRecording(): Recording | null {
    if (!this.isRecording) {
      return null;
    }

    this.isRecording = false;
    this.isPaused = false;
    
    // Finish any active notes
    this.finishActiveNotes();
    
    if (!this.currentRecording) {
      return null;
    }

    // Finalize recording
    this.currentRecording.duration = this.getTotalRecordingDuration();
    this.currentRecording.notes = [...this.recordingNotes];
    this.currentRecording.metadata = this.calculateMetadata(this.recordingNotes);
    
    // Save recording
    this.recordings.set(this.currentRecording.id, this.currentRecording);
    this.saveRecordings();
    
    const recording = this.currentRecording;
    this.currentRecording = null;
    this.recordingNotes = [];
    
    this.emit('recordingStopped', recording);
    return recording;
  }

  public recordNote(key: string, _soundConfig: SoundConfig): void {
    if (!this.isRecording || this.isPaused) {
      return;
    }

    const now = performance.now();
    const timestamp = now - this.recordingStartTime;
    
    // Check if recording is too long
    if (timestamp > this.MAX_RECORDING_DURATION) {
      this.stopRecording();
      this.emit('recordingLimitReached');
      return;
    }

    // Start tracking this note
    this.activeNotes.set(key, timestamp);
  }

  public finishNote(key: string, soundConfig: SoundConfig): void {
    if (!this.isRecording || this.isPaused) {
      return;
    }

    const noteStart = this.activeNotes.get(key);
    if (noteStart === undefined) {
      return;
    }

    const now = performance.now();
    const timestamp = now - this.recordingStartTime;
    const duration = timestamp - noteStart;

    const recordedNote: RecordedNote = {
      timestamp: noteStart,
      key,
      soundConfig: { ...soundConfig },
      duration
    };

    this.recordingNotes.push(recordedNote);
    this.activeNotes.delete(key);
    
    this.emit('noteRecorded', recordedNote);
  }

  // Playback Methods
  public playRecording(recording: Recording, speed: number = 1.0): boolean {
    if (this.isPlaying || this.isRecording) {
      return false;
    }

    this.isPlaying = true;
    this.playbackState = {
      isPlaying: true,
      currentTime: 0,
      totalDuration: recording.duration,
      recording,
      playbackSpeed: speed
    };

    this.playbackStartTime = performance.now();
    this.schedulePlaybackNotes(recording, speed);
    
    this.emit('playbackStarted', recording);
    
    // Schedule playback end
    const adjustedDuration = recording.duration / speed;
    const endTimeout = window.setTimeout(() => {
      this.stopPlayback();
    }, adjustedDuration);
    
    this.playbackTimeoutIds.push(endTimeout);
    return true;
  }

  public stopPlayback(): void {
    if (!this.isPlaying) {
      return;
    }

    this.isPlaying = false;
    
    // Clear all scheduled playback
    this.playbackTimeoutIds.forEach(id => clearTimeout(id));
    this.playbackTimeoutIds = [];
    
    const recording = this.playbackState.recording;
    this.playbackState = {
      isPlaying: false,
      currentTime: 0,
      totalDuration: 0,
      recording: null,
      playbackSpeed: 1.0
    };
    
    this.emit('playbackStopped', recording);
  }

  public pausePlayback(): boolean {
    // For simplicity, we'll stop and allow resume from beginning
    // In a more advanced version, we could implement true pause/resume
    if (this.isPlaying) {
      this.stopPlayback();
      return true;
    }
    return false;
  }

  private schedulePlaybackNotes(recording: Recording, speed: number): void {
    recording.notes.forEach(note => {
      const adjustedDelay = note.timestamp / speed;
      
      const timeoutId = window.setTimeout(() => {
        if (this.isPlaying) {
          this.emit('playbackNote', note);
        }
      }, adjustedDelay);
      
      this.playbackTimeoutIds.push(timeoutId);
    });
  }

  // Recording Management
  public getRecordings(): Recording[] {
    return Array.from(this.recordings.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  public getRecording(id: string): Recording | null {
    return this.recordings.get(id) || null;
  }

  public deleteRecording(id: string): boolean {
    if (this.recordings.has(id)) {
      this.recordings.delete(id);
      this.saveRecordings();
      this.emit('recordingDeleted', id);
      return true;
    }
    return false;
  }

  public renameRecording(id: string, newName: string): boolean {
    const recording = this.recordings.get(id);
    if (recording) {
      recording.name = newName;
      this.saveRecordings();
      this.emit('recordingRenamed', { id, name: newName });
      return true;
    }
    return false;
  }

  // State Getters
  public getRecordingState(): { isRecording: boolean; isPaused: boolean; duration: number } {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      duration: this.isRecording ? this.getTotalRecordingDuration() : 0
    };
  }

  public getPlaybackState(): PlaybackState {
    if (this.isPlaying && this.playbackState.recording) {
      // Update current time
      const elapsed = performance.now() - this.playbackStartTime;
      this.playbackState.currentTime = Math.min(elapsed * this.playbackState.playbackSpeed, this.playbackState.totalDuration);
    }
    return { ...this.playbackState };
  }

  // Helper Methods
  private finishActiveNotes(): void {
    const now = performance.now();
    const timestamp = now - this.recordingStartTime;
    
    this.activeNotes.forEach((startTime, key) => {
      const duration = timestamp - startTime;
      const recordedNote: RecordedNote = {
        timestamp: startTime,
        key,
        soundConfig: { 
          key, 
          instrument: 'synthPad', 
          note: 'C', 
          octave: 4, 
          frequency: 440, 
          volume: 0.8, 
          duration: 0.5, 
          color: '#FF00FF' 
        },
        duration
      };
      this.recordingNotes.push(recordedNote);
    });
    
    this.activeNotes.clear();
  }

  private getTotalRecordingDuration(): number {
    return performance.now() - this.recordingStartTime;
  }

  private calculateMetadata(notes: RecordedNote[]): Recording['metadata'] {
    const instrumentsUsed = [...new Set(notes.map(note => note.soundConfig.instrument))];
    const keyCount = notes.length;
    const duration = Math.max(...notes.map(note => note.timestamp + note.duration), 0);
    const avgNotesPerSecond = duration > 0 ? keyCount / (duration / 1000) : 0;

    return {
      keyCount,
      instrumentsUsed,
      avgNotesPerSecond: Math.round(avgNotesPerSecond * 100) / 100
    };
  }

  private generateId(): string {
    return `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage Methods
  private saveRecordings(): void {
    try {
      const recordingsArray = Array.from(this.recordings.values());
      localStorage.setItem('keyboardCosmicJam_recordings', JSON.stringify(recordingsArray));
    } catch (error) {
      console.warn('Failed to save recordings to localStorage:', error);
    }
  }

  private loadStoredRecordings(): void {
    try {
      const stored = localStorage.getItem('keyboardCosmicJam_recordings');
      if (stored) {
        const recordingsArray: Recording[] = JSON.parse(stored);
        recordingsArray.forEach(recording => {
          this.recordings.set(recording.id, recording);
        });
      }
    } catch (error) {
      console.warn('Failed to load recordings from localStorage:', error);
    }
  }

  public exportRecording(recording: Recording): string {
    return JSON.stringify(recording, null, 2);
  }

  public importRecording(recordingData: string): Recording | null {
    try {
      const recording: Recording = JSON.parse(recordingData);
      
      // Validate recording structure
      if (!recording.id || !recording.name || !Array.isArray(recording.notes)) {
        throw new Error('Invalid recording format');
      }
      
      // Generate new ID to avoid conflicts
      recording.id = this.generateId();
      
      this.recordings.set(recording.id, recording);
      this.saveRecordings();
      
      this.emit('recordingImported', recording);
      return recording;
    } catch (error) {
      console.error('Failed to import recording:', error);
      return null;
    }
  }

  public cleanup(): void {
    this.stopRecording();
    this.stopPlayback();
    this.recordings.clear();
  }
}