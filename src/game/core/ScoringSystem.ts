import { EventEmitter } from '@utils/EventEmitter';

export interface ScoreEvent {
  basePoints: number;
  multiplier: number;
  totalPoints: number;
  combo: number;
  accuracy: number;
}

export interface ScoreState {
  totalScore: number;
  currentCombo: number;
  maxCombo: number;
  notesPlayed: number;
  accuracy: number;
  multiplier: number;
}

export class ScoringSystem extends EventEmitter {
  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private notesPlayed = 0;
  private accurateNotes = 0;
  private beatInterval = 500; // ms between beats for rhythm accuracy
  private comboTimer: number | null = null;
  
  // Scoring configuration
  private readonly BASE_POINTS = 10;
  private readonly TIMING_WINDOW = 100; // ms for perfect timing
  private readonly COMBO_TIMEOUT = 2000; // ms before combo breaks
  
  // Multiplier thresholds
  private readonly MULTIPLIERS = [
    { combo: 30, multiplier: 5, name: 'Rainbow' },
    { combo: 20, multiplier: 3, name: 'Fire' },
    { combo: 10, multiplier: 2, name: 'Hot' },
    { combo: 5, multiplier: 1.5, name: 'Warm' },
    { combo: 0, multiplier: 1, name: 'Normal' },
  ];

  constructor() {
    super();
  }

  public notePressed(timestamp: number = Date.now()): ScoreEvent {
    const timingAccuracy = this.calculateTimingAccuracy(timestamp);
    const basePoints = this.calculateBasePoints(timingAccuracy);
    
    // Update combo
    this.updateCombo();
    
    // Calculate multiplier based on current combo
    const multiplier = this.getCurrentMultiplier();
    
    // Calculate total points
    const totalPoints = Math.round(basePoints * multiplier);
    
    // Update score
    this.score += totalPoints;
    this.notesPlayed++;
    
    if (timingAccuracy > 0.8) {
      this.accurateNotes++;
    }
    
    // Create score event
    const scoreEvent: ScoreEvent = {
      basePoints,
      multiplier,
      totalPoints,
      combo: this.combo,
      accuracy: timingAccuracy,
    };
    
    // Emit events
    this.emit('noteScored', scoreEvent);
    this.emit('scoreUpdated', this.getState());
    
    // Check for combo milestones
    this.checkComboMilestones();
    
    return scoreEvent;
  }
  
  private updateCombo(): void {
    // Clear existing combo timer
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
    }
    
    // Increment combo
    this.combo++;
    
    // Update max combo
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    
    // Set new combo timer
    this.comboTimer = setTimeout(() => {
      this.breakCombo();
    }, this.COMBO_TIMEOUT) as unknown as number;
  }
  
  private breakCombo(): void {
    if (this.combo > 0) {
      const previousCombo = this.combo;
      this.combo = 0;
      this.emit('comboBreak', previousCombo);
      this.emit('scoreUpdated', this.getState());
    }
  }
  
  private calculateTimingAccuracy(timestamp: number): number {
    // Calculate how close the note is to the beat
    const timeSinceLastBeat = timestamp % this.beatInterval;
    const distanceFromBeat = Math.min(
      timeSinceLastBeat,
      this.beatInterval - timeSinceLastBeat
    );
    
    // Convert to accuracy (1.0 = perfect, 0.0 = worst)
    const accuracy = Math.max(0, 1 - (distanceFromBeat / this.TIMING_WINDOW));
    return accuracy;
  }
  
  private calculateBasePoints(accuracy: number): number {
    // Base points increase with accuracy
    const accuracyBonus = Math.round(this.BASE_POINTS * accuracy * 4);
    return this.BASE_POINTS + accuracyBonus;
  }
  
  private getCurrentMultiplier(): number {
    for (const tier of this.MULTIPLIERS) {
      if (this.combo >= tier.combo) {
        return tier.multiplier;
      }
    }
    return 1;
  }
  
  private checkComboMilestones(): void {
    // Check for multiplier changes
    for (const tier of this.MULTIPLIERS) {
      if (this.combo === tier.combo && tier.combo > 0) {
        this.emit('multiplierReached', {
          combo: tier.combo,
          multiplier: tier.multiplier,
          name: tier.name,
        });
      }
    }
    
    // Special milestones
    if (this.combo === 50) {
      this.emit('milestone', { type: 'combo', value: 50, name: 'Cosmic Combo!' });
    } else if (this.combo === 100) {
      this.emit('milestone', { type: 'combo', value: 100, name: 'Galactic Genius!' });
    }
  }
  
  public getState(): ScoreState {
    const accuracy = this.notesPlayed > 0 
      ? this.accurateNotes / this.notesPlayed 
      : 0;
    
    return {
      totalScore: this.score,
      currentCombo: this.combo,
      maxCombo: this.maxCombo,
      notesPlayed: this.notesPlayed,
      accuracy: Math.round(accuracy * 100),
      multiplier: this.getCurrentMultiplier(),
    };
  }
  
  public reset(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.notesPlayed = 0;
    this.accurateNotes = 0;
    
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
      this.comboTimer = null;
    }
    
    this.emit('scoreReset');
    this.emit('scoreUpdated', this.getState());
  }
  
  public setBeatInterval(bpm: number): void {
    this.beatInterval = 60000 / bpm; // Convert BPM to ms interval
  }
  
  public getScore(): number {
    return this.score;
  }
  
  public getCombo(): number {
    return this.combo;
  }
  
  public forceBreakCombo(): void {
    this.breakCombo();
  }
}