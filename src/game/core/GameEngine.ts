import { AudioEngine } from '../audio/AudioEngine';
import { VisualEngine } from '../visuals/VisualEngine';
import { InputManager } from './InputManager';
import { GameState } from './GameState';
import { RecordingEngine, Recording } from '../audio/RecordingEngine';
import { ScoringSystem } from './ScoringSystem';
import { AchievementSystem } from './AchievementSystem';
import { ProgressionSystem } from './ProgressionSystem';
import { StoryMode } from '../modes/StoryMode';
import { EventEmitter } from '@utils/EventEmitter';

export interface GameEngineConfig {
  audioEngine: AudioEngine;
  visualEngine: VisualEngine;
  inputManager: InputManager;
  recordingEngine?: RecordingEngine;
}

export class GameEngine extends EventEmitter {
  private audioEngine: AudioEngine;
  private visualEngine: VisualEngine;
  private inputManager: InputManager;
  private recordingEngine: RecordingEngine;
  private gameState: GameState;
  private scoringSystem: ScoringSystem;
  private achievementSystem: AchievementSystem;
  private progressionSystem: ProgressionSystem;
  private storyMode: StoryMode;
  private animationId: number | null = null;
  private lastTime = 0;
  private isRunning = false;

  constructor(config: GameEngineConfig) {
    super();
    this.audioEngine = config.audioEngine;
    this.visualEngine = config.visualEngine;
    this.inputManager = config.inputManager;
    this.recordingEngine = config.recordingEngine || new RecordingEngine();
    this.gameState = new GameState();
    this.scoringSystem = new ScoringSystem();
    this.achievementSystem = new AchievementSystem();
    this.progressionSystem = new ProgressionSystem();
    this.storyMode = new StoryMode();
    
    this.setupEventListeners();
    this.setupScoringListeners();
    this.setupAchievementListeners();
    this.setupProgressionListeners();
    this.setupStoryModeListeners();
  }

  private setupEventListeners(): void {
    // Connect input events to game systems
    this.inputManager.on('keyPress', this.handleKeyPress.bind(this));
    this.inputManager.on('keyRelease', this.handleKeyRelease.bind(this));
    this.inputManager.on('touchPress', this.handleTouchPress.bind(this));
    this.inputManager.on('touchRelease', this.handleTouchRelease.bind(this));
    
    // Listen for system events
    this.audioEngine.on('soundPlayed', this.handleSoundPlayed.bind(this));
    this.visualEngine.on('effectComplete', this.handleEffectComplete.bind(this));
    
    // Recording engine events
    this.recordingEngine.on('playbackNote', this.handlePlaybackNote.bind(this));
    this.recordingEngine.on('recordingStarted', (recording: Recording) => {
      this.emit('recordingStarted', recording);
    });
    this.recordingEngine.on('recordingStopped', (recording: Recording) => {
      this.emit('recordingStopped', recording);
    });
    this.recordingEngine.on('playbackStarted', (recording: Recording) => {
      this.emit('playbackStarted', recording);
    });
    this.recordingEngine.on('playbackStopped', (recording: Recording) => {
      this.emit('playbackStopped', recording);
    });
  }
  
  private setupScoringListeners(): void {
    // Listen for scoring events
    this.scoringSystem.on('noteScored', (scoreEvent) => {
      this.emit('noteScored', scoreEvent);
    });
    
    this.scoringSystem.on('scoreUpdated', (scoreState) => {
      this.emit('scoreUpdated', scoreState);
    });
    
    this.scoringSystem.on('comboBreak', (previousCombo) => {
      this.emit('comboBreak', previousCombo);
    });
    
    this.scoringSystem.on('multiplierReached', (data) => {
      this.emit('multiplierReached', data);
      // Trigger special visual effect for multiplier changes
      this.visualEngine.triggerMultiplierEffect(data);
    });
    
    this.scoringSystem.on('milestone', (data) => {
      this.emit('milestone', data);
      // Trigger celebration effect
      this.visualEngine.triggerCelebrationEffect(data);
    });
  }
  
  private setupAchievementListeners(): void {
    // Listen for achievement unlocks
    this.achievementSystem.on('achievementUnlocked', (achievement) => {
      this.emit('achievementUnlocked', achievement);
      // Trigger special celebration for achievements
      this.visualEngine.triggerCelebrationEffect({
        type: 'achievement',
        value: 1,
        name: achievement.name
      });
    });
    
    // Connect scoring system to achievements
    this.scoringSystem.on('noteScored', (scoreEvent) => {
      this.achievementSystem.notePlayedWithAccuracy(scoreEvent.accuracy);
    });
    
    this.scoringSystem.on('scoreUpdated', (scoreState) => {
      this.achievementSystem.comboReached(scoreState.currentCombo);
      this.achievementSystem.scoreReached(scoreState.totalScore);
    });
    
    // Connect game state to achievements
    this.gameState.on('recordingStopped', () => {
      this.achievementSystem.recordingMade();
    });
    
    this.gameState.on('levelUnlocked', (level) => {
      this.achievementSystem.levelCompleted(level - 1); // Previous level was completed
    });
  }
  
  private setupProgressionListeners(): void {
    // Listen for unlock triggers
    this.achievementSystem.on('achievementUnlocked', () => {
      // Check for unlocks based on achievements
      const unlockedAchievements = this.achievementSystem.getUnlockedAchievements()
        .map(a => a.id);
      this.progressionSystem.checkUnlocks({ achievements: unlockedAchievements });
    });
    
    this.scoringSystem.on('scoreUpdated', (scoreState) => {
      // Check for score-based unlocks
      this.progressionSystem.checkUnlocks({ score: scoreState.totalScore });
    });
    
    this.storyMode.on('levelCompleted', (data) => {
      // Check for level-based unlocks
      this.progressionSystem.checkUnlocks({ level: data.level.id });
    });
    
    // Listen for unlock notifications
    this.progressionSystem.on('itemUnlocked', (notification) => {
      this.emit('itemUnlocked', notification);
      
      // Show celebration for unlocks
      this.visualEngine.triggerCelebrationEffect({
        type: 'unlock',
        value: 1,
        name: `${notification.unlockable.name} Unlocked!`
      });
    });
  }
  
  private setupStoryModeListeners(): void {
    // Listen for story mode events
    this.storyMode.on('levelStarted', (level) => {
      this.emit('storyLevelStarted', level);
      // Set visual theme based on level
      if (level.visualTheme) {
        this.visualEngine.setTheme(level.visualTheme);
      }
    });
    
    this.storyMode.on('objectiveCompleted', (objective) => {
      this.emit('objectiveCompleted', objective);
      // Trigger celebration
      this.visualEngine.triggerCelebrationEffect({
        type: 'objective',
        value: 1,
        name: objective.description
      });
    });
    
    this.storyMode.on('levelCompleted', (data) => {
      this.emit('storyLevelCompleted', data);
      // Update game state to unlock next level
      this.gameState.unlockLevel(data.level.id + 1);
      // Track achievement
      this.achievementSystem.levelCompleted(data.level.id);
    });
    
    this.storyMode.on('progressUpdated', (level, progress) => {
      this.emit('storyProgressUpdated', { level, progress });
    });
    
    // Connect scoring to story mode
    this.scoringSystem.on('scoreUpdated', (scoreState) => {
      if (this.gameState.getCurrentMode() === 'story') {
        this.storyMode.updateProgress({
          score: scoreState.totalScore,
          combo: scoreState.currentCombo,
          accuracy: scoreState.accuracy / 100
        });
      }
    });
  }

  private async handleKeyPress(key: string): Promise<void> {
    if (!this.isRunning) return;
    
    // Trigger audio
    const sound = await this.audioEngine.playKeySound(key);
    
    // Record note start
    if (sound) {
      this.recordingEngine.recordNote(key, sound);
      
      // Score the note
      const scoreEvent = this.scoringSystem.notePressed();
      
      // Track instrument usage for achievements
      this.achievementSystem.instrumentUsed(sound.instrument);
      
      // Update story mode progress if active
      if (this.gameState.getCurrentMode() === 'story') {
        this.storyMode.updateProgress({
          notePlayed: true,
          key: key,
          instrument: sound.instrument
        });
      }
      
      // Trigger visual effect with score data
      this.visualEngine.triggerKeyEffect(key, sound, scoreEvent);
    }
    
    // Update game state
    this.gameState.recordKeyPress(key);
    
    // Emit game event
    this.emit('keyPlayed', { key, sound });
  }

  private handleKeyRelease(key: string): void {
    if (!this.isRunning) return;
    
    // For recording, we need to estimate what sound would have been played
    // This is a simplified approach - in practice you might track active sounds
    this.recordingEngine.finishNote(key, {
      key,
      instrument: 'synthPad',
      note: 'C',
      octave: 4,
      frequency: 440,
      volume: 0.8,
      duration: 0.5,
      color: '#FF00FF'
    });
  }

  private async handleTouchPress(touch: { x: number; y: number }): Promise<void> {
    if (!this.isRunning) return;
    
    // Convert touch to zone
    const zone = this.inputManager.getTouchZone(touch);
    if (!zone) return;
    
    // Trigger audio
    const sound = await this.audioEngine.playZoneSound(zone);
    
    // Record note start (use first key from zone)
    if (sound && zone.keys.length > 0) {
      this.recordingEngine.recordNote(zone.keys[0], sound);
      
      // Score the note
      const scoreEvent = this.scoringSystem.notePressed();
      
      // Trigger visual effect with score data
      this.visualEngine.triggerTouchEffect(touch, sound, scoreEvent);
    }
    
    // Update game state
    this.gameState.recordTouch(touch);
    
    // Emit game event
    this.emit('touchPlayed', { touch, zone, sound });
  }

  private handleTouchRelease(touch: { x: number; y: number }): void {
    if (!this.isRunning) return;
    
    // Convert touch to zone
    const zone = this.inputManager.getTouchZone(touch);
    if (!zone || zone.keys.length === 0) return;
    
    // Finish recording the note
    this.recordingEngine.finishNote(zone.keys[0], {
      key: zone.keys[0],
      instrument: zone.instrument || 'synthPad',
      note: 'C',
      octave: 4,
      frequency: 440,
      volume: 0.8,
      duration: 0.5,
      color: zone.color || '#FF00FF'
    });
  }

  private handleSoundPlayed(data: any): void {
    // Track sounds for recording feature
    this.gameState.addToRecording(data);
  }

  private handleEffectComplete(effectId: string): void {
    // Clean up completed effects
    this.visualEngine.removeEffect(effectId);
  }

  private async handlePlaybackNote(recordedNote: any): Promise<void> {
    // Play back a recorded note
    const sound = await this.audioEngine.playKeySound(recordedNote.key);
    
    if (sound) {
      // Trigger visual effect for playback
      this.visualEngine.triggerKeyEffect(recordedNote.key, sound);
    }
    
    this.emit('notePlayedBack', recordedNote);
  }

  private setupTouchZoneDisplay(): void {
    // Get touch zones from input manager and display them
    const touchZones = this.inputManager.getTouchZones();
    this.visualEngine.showTouchZones(touchZones);

    // Listen for window resize to update touch zones
    window.addEventListener('resize', () => {
      // Regenerate touch zones for new screen size
      setTimeout(() => {
        this.inputManager.initialize(); // This will regenerate zones
        const newTouchZones = this.inputManager.getTouchZones();
        this.visualEngine.updateTouchZones(newTouchZones);
      }, 100); // Small delay to ensure resize is complete
    });
  }

  private gameLoop = (currentTime: number): void => {
    if (!this.isRunning) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Update all systems
    this.audioEngine.update(deltaTime);
    this.visualEngine.update(deltaTime);
    this.gameState.update(deltaTime);
    
    // Update achievement play time
    this.achievementSystem.updateStats({ totalPlayTime: deltaTime });
    
    // Continue loop
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  public async start(): Promise<void> {
    if (this.isRunning) return;
    
    try {
      // Initialize all systems
      await this.audioEngine.initialize();
      await this.visualEngine.initialize();
      this.inputManager.initialize();
      
      // Connect touch zones to visual engine
      this.setupTouchZoneDisplay();
      
      // Start game loop
      this.isRunning = true;
      this.lastTime = performance.now();
      this.animationId = requestAnimationFrame(this.gameLoop);
      
      // Track session start
      this.achievementSystem.updateStats({ sessionsPlayed: 1 });
      
      this.emit('gameStarted');
    } catch (error) {
      console.error('Failed to start game engine:', error);
      throw error;
    }
  }

  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Cleanup systems
    this.audioEngine.cleanup();
    this.visualEngine.cleanup();
    this.inputManager.cleanup();
    
    this.emit('gameStopped');
  }

  public getState(): GameState {
    return this.gameState;
  }

  public getAudioEngine(): AudioEngine {
    return this.audioEngine;
  }

  public getVisualEngine(): VisualEngine {
    return this.visualEngine;
  }

  public getInputManager(): InputManager {
    return this.inputManager;
  }

  public getRecordingEngine(): RecordingEngine {
    return this.recordingEngine;
  }

  // Recording Control Methods
  public startRecording(name?: string): boolean {
    return this.recordingEngine.startRecording(name);
  }

  public stopRecording(): Recording | null {
    return this.recordingEngine.stopRecording();
  }

  public pauseRecording(): boolean {
    return this.recordingEngine.pauseRecording();
  }

  public resumeRecording(): boolean {
    return this.recordingEngine.resumeRecording();
  }

  public playRecording(recording: Recording, speed?: number): boolean {
    return this.recordingEngine.playRecording(recording, speed);
  }

  public stopPlayback(): void {
    this.recordingEngine.stopPlayback();
  }

  public getRecordings(): Recording[] {
    return this.recordingEngine.getRecordings();
  }

  public deleteRecording(id: string): boolean {
    return this.recordingEngine.deleteRecording(id);
  }

  public renameRecording(id: string, newName: string): boolean {
    return this.recordingEngine.renameRecording(id, newName);
  }

  public exportRecording(recording: Recording): string {
    return this.recordingEngine.exportRecording(recording);
  }

  public importRecording(recordingData: string): Recording | null {
    return this.recordingEngine.importRecording(recordingData);
  }
  
  public getScoringSystem(): ScoringSystem {
    return this.scoringSystem;
  }
  
  public resetScore(): void {
    this.scoringSystem.reset();
  }
  
  public getAchievementSystem(): AchievementSystem {
    return this.achievementSystem;
  }
  
  public getStoryMode(): StoryMode {
    return this.storyMode;
  }
  
  public startStoryLevel(levelId: number): boolean {
    if (this.storyMode.startLevel(levelId)) {
      this.gameState.setMode('story');
      this.gameState.setLevel(levelId);
      this.resetScore(); // Reset score for the level
      return true;
    }
    return false;
  }
  
  public endStoryLevel(): void {
    this.storyMode.endLevel();
    this.gameState.setMode('menu');
  }
  
  public getProgressionSystem(): ProgressionSystem {
    return this.progressionSystem;
  }
}