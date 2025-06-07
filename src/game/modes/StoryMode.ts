import { EventEmitter } from '@utils/EventEmitter';

export interface LevelObjective {
  id: string;
  description: string;
  type: 'notes' | 'combo' | 'pattern' | 'instrument' | 'score' | 'time';
  target: number | string[];
  progress: number;
  completed: boolean;
}

export interface StoryLevel {
  id: number;
  name: string;
  description: string;
  theme: string;
  difficulty: 'easy' | 'medium' | 'hard';
  objectives: LevelObjective[];
  rewards: {
    instruments?: string[];
    effects?: string[];
    sounds?: string[];
    badges?: string[];
  };
  backgroundMusic?: string;
  visualTheme: string;
  unlocked: boolean;
  completed: boolean;
  stars: number; // 0-3 stars based on performance
}

export interface LevelProgress {
  levelId: number;
  startTime: number;
  endTime?: number;
  score: number;
  notesPlayed: number;
  maxCombo: number;
  accuracy: number;
  objectivesCompleted: string[];
}

export class StoryMode extends EventEmitter {
  private levels: Map<number, StoryLevel> = new Map();
  private currentLevel: StoryLevel | null = null;
  private currentProgress: LevelProgress | null = null;
  private patternBuffer: string[] = [];
  private instrumentsUsed: Set<string> = new Set();

  constructor() {
    super();
    this.initializeLevels();
    this.loadProgress();
  }

  private initializeLevels(): void {
    // Level 1: Space Disco
    this.levels.set(1, {
      id: 1,
      name: 'Space Disco',
      description: 'Help DJ Cosmic Cat throw the best space party!',
      theme: 'space-disco',
      difficulty: 'easy',
      objectives: [
        {
          id: 'play-notes',
          description: 'Play 30 notes to get the party started',
          type: 'notes',
          target: 30,
          progress: 0,
          completed: false
        },
        {
          id: 'combo-groove',
          description: 'Keep a 10-note combo groove going',
          type: 'combo',
          target: 10,
          progress: 0,
          completed: false
        },
        {
          id: 'disco-pattern',
          description: 'Play the disco pattern: Q-W-E-R',
          type: 'pattern',
          target: ['q', 'w', 'e', 'r'],
          progress: 0,
          completed: false
        }
      ],
      rewards: {
        instruments: ['synthLead'],
        effects: ['disco-lights'],
        badges: ['space-starter']
      },
      backgroundMusic: 'space-disco-beat',
      visualTheme: 'disco',
      unlocked: true,
      completed: false,
      stars: 0
    });

    // Level 2: Neon Zoo
    this.levels.set(2, {
      id: 2,
      name: 'Neon Zoo',
      description: 'Wake up the sleeping neon animals with your music!',
      theme: 'neon-zoo',
      difficulty: 'easy',
      objectives: [
        {
          id: 'wake-animals',
          description: 'Play 50 notes to wake all the animals',
          type: 'notes',
          target: 50,
          progress: 0,
          completed: false
        },
        {
          id: 'use-instruments',
          description: 'Use 2 different instruments',
          type: 'instrument',
          target: 2,
          progress: 0,
          completed: false
        },
        {
          id: 'animal-sounds',
          description: 'Score 500 points with animal rhythms',
          type: 'score',
          target: 500,
          progress: 0,
          completed: false
        }
      ],
      rewards: {
        instruments: ['fmBell'],
        effects: ['animal-particles'],
        sounds: ['animal-pack'],
        badges: ['animal-whisperer']
      },
      backgroundMusic: 'jungle-beat',
      visualTheme: 'zoo',
      unlocked: false,
      completed: false,
      stars: 0
    });

    // Level 3: Rainbow Road
    this.levels.set(3, {
      id: 3,
      name: 'Rainbow Road',
      description: 'Paint the rainbow bridge with musical colors!',
      theme: 'rainbow-road',
      difficulty: 'medium',
      objectives: [
        {
          id: 'paint-rainbow',
          description: 'Play 100 notes to complete the rainbow',
          type: 'notes',
          target: 100,
          progress: 0,
          completed: false
        },
        {
          id: 'color-combo',
          description: 'Get a 20-note color combo',
          type: 'combo',
          target: 20,
          progress: 0,
          completed: false
        },
        {
          id: 'rainbow-pattern',
          description: 'Play the rainbow sequence: A-S-D-F-G-H-J',
          type: 'pattern',
          target: ['a', 's', 'd', 'f', 'g', 'h', 'j'],
          progress: 0,
          completed: false
        }
      ],
      rewards: {
        instruments: ['synthPad'],
        effects: ['rainbow-trail'],
        badges: ['color-creator']
      },
      backgroundMusic: 'rainbow-melody',
      visualTheme: 'rainbow',
      unlocked: false,
      completed: false,
      stars: 0
    });

    // Level 4: Cosmic Orchestra
    this.levels.set(4, {
      id: 4,
      name: 'Cosmic Orchestra',
      description: "Conduct the universe's greatest band!",
      theme: 'cosmic-orchestra',
      difficulty: 'hard',
      objectives: [
        {
          id: 'orchestra-performance',
          description: 'Play 200 notes in your performance',
          type: 'notes',
          target: 200,
          progress: 0,
          completed: false
        },
        {
          id: 'master-combo',
          description: 'Achieve a 30-note master combo',
          type: 'combo',
          target: 30,
          progress: 0,
          completed: false
        },
        {
          id: 'all-instruments',
          description: 'Use all 6 instruments in your symphony',
          type: 'instrument',
          target: 6,
          progress: 0,
          completed: false
        },
        {
          id: 'cosmic-score',
          description: 'Score 2000 points for a standing ovation',
          type: 'score',
          target: 2000,
          progress: 0,
          completed: false
        }
      ],
      rewards: {
        instruments: ['arpeggiate'],
        effects: ['cosmic-finale'],
        badges: ['cosmic-conductor']
      },
      backgroundMusic: 'cosmic-symphony',
      visualTheme: 'cosmic',
      unlocked: false,
      completed: false,
      stars: 0
    });
  }

  private loadProgress(): void {
    try {
      const saved = localStorage.getItem('cosmic-jam-story-progress');
      if (saved) {
        const data = JSON.parse(saved);
        
        // Update level states
        data.levels?.forEach((savedLevel: any) => {
          const level = this.levels.get(savedLevel.id);
          if (level) {
            level.unlocked = savedLevel.unlocked;
            level.completed = savedLevel.completed;
            level.stars = savedLevel.stars || 0;
            
            // Update objective progress
            if (savedLevel.objectives) {
              savedLevel.objectives.forEach((savedObj: any) => {
                const objective = level.objectives.find(o => o.id === savedObj.id);
                if (objective) {
                  objective.progress = savedObj.progress;
                  objective.completed = savedObj.completed;
                }
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to load story progress:', error);
    }
  }

  private saveProgress(): void {
    try {
      const data = {
        levels: Array.from(this.levels.values()).map(level => ({
          id: level.id,
          unlocked: level.unlocked,
          completed: level.completed,
          stars: level.stars,
          objectives: level.objectives.map(obj => ({
            id: obj.id,
            progress: obj.progress,
            completed: obj.completed
          }))
        }))
      };
      
      localStorage.setItem('cosmic-jam-story-progress', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save story progress:', error);
    }
  }

  public startLevel(levelId: number): boolean {
    const level = this.levels.get(levelId);
    if (!level || !level.unlocked) {
      return false;
    }
    
    this.currentLevel = level;
    this.currentProgress = {
      levelId: level.id,
      startTime: Date.now(),
      score: 0,
      notesPlayed: 0,
      maxCombo: 0,
      accuracy: 0,
      objectivesCompleted: []
    };
    
    // Reset tracking
    this.patternBuffer = [];
    this.instrumentsUsed.clear();
    
    this.emit('levelStarted', level);
    return true;
  }

  public updateProgress(updates: {
    notePlayed?: boolean;
    combo?: number;
    score?: number;
    accuracy?: number;
    key?: string;
    instrument?: string;
  }): void {
    if (!this.currentLevel || !this.currentProgress) return;
    
    // Update progress stats
    if (updates.notePlayed) {
      this.currentProgress.notesPlayed++;
    }
    if (updates.combo !== undefined && updates.combo > this.currentProgress.maxCombo) {
      this.currentProgress.maxCombo = updates.combo;
    }
    if (updates.score !== undefined) {
      this.currentProgress.score = updates.score;
    }
    if (updates.accuracy !== undefined) {
      this.currentProgress.accuracy = updates.accuracy;
    }
    if (updates.instrument) {
      this.instrumentsUsed.add(updates.instrument);
    }
    
    // Track pattern buffer
    if (updates.key) {
      this.patternBuffer.push(updates.key.toLowerCase());
      if (this.patternBuffer.length > 10) {
        this.patternBuffer.shift();
      }
    }
    
    // Check objectives
    this.checkObjectives();
  }

  private checkObjectives(): void {
    if (!this.currentLevel || !this.currentProgress) return;
    
    let anyCompleted = false;
    
    this.currentLevel.objectives.forEach(objective => {
      if (objective.completed) return;
      
      let wasCompleted = false;
      
      switch (objective.type) {
        case 'notes':
          objective.progress = this.currentProgress!.notesPlayed;
          if (objective.progress >= (objective.target as number)) {
            wasCompleted = true;
          }
          break;
          
        case 'combo':
          objective.progress = this.currentProgress!.maxCombo;
          if (objective.progress >= (objective.target as number)) {
            wasCompleted = true;
          }
          break;
          
        case 'score':
          objective.progress = this.currentProgress!.score;
          if (objective.progress >= (objective.target as number)) {
            wasCompleted = true;
          }
          break;
          
        case 'instrument':
          objective.progress = this.instrumentsUsed.size;
          if (objective.progress >= (objective.target as number)) {
            wasCompleted = true;
          }
          break;
          
        case 'pattern':
          const pattern = objective.target as string[];
          if (this.checkPattern(pattern)) {
            objective.progress = pattern.length;
            wasCompleted = true;
          }
          break;
      }
      
      if (wasCompleted) {
        objective.completed = true;
        this.currentProgress!.objectivesCompleted.push(objective.id);
        anyCompleted = true;
        this.emit('objectiveCompleted', objective);
      }
    });
    
    if (anyCompleted) {
      this.emit('progressUpdated', this.currentLevel, this.currentProgress);
      
      // Check if all objectives completed
      if (this.currentLevel.objectives.every(o => o.completed)) {
        this.completeLevel();
      }
    }
  }

  private checkPattern(pattern: string[]): boolean {
    if (this.patternBuffer.length < pattern.length) return false;
    
    const bufferString = this.patternBuffer.join('');
    const patternString = pattern.join('');
    
    return bufferString.includes(patternString);
  }

  private completeLevel(): void {
    if (!this.currentLevel || !this.currentProgress) return;
    
    this.currentProgress.endTime = Date.now();
    
    // Calculate stars based on performance
    const stars = this.calculateStars();
    this.currentLevel.stars = Math.max(this.currentLevel.stars, stars);
    this.currentLevel.completed = true;
    
    // Unlock next level
    const nextLevel = this.levels.get(this.currentLevel.id + 1);
    if (nextLevel) {
      nextLevel.unlocked = true;
    }
    
    this.saveProgress();
    
    this.emit('levelCompleted', {
      level: this.currentLevel,
      progress: this.currentProgress,
      stars
    });
  }

  private calculateStars(): number {
    if (!this.currentLevel || !this.currentProgress) return 0;
    
    let stars = 1; // Base star for completion
    
    // Star 2: Complete in good time
    const timeSpent = (this.currentProgress.endTime! - this.currentProgress.startTime) / 1000;
    const targetTime = this.currentLevel.objectives.length * 30; // 30 seconds per objective
    if (timeSpent <= targetTime) {
      stars++;
    }
    
    // Star 3: High accuracy or score
    if (this.currentProgress.accuracy > 80) {
      stars++;
    } else {
      const scoreObjective = this.currentLevel.objectives.find(o => o.type === 'score');
      if (scoreObjective && this.currentProgress.score > (scoreObjective.target as number) * 1.5) {
        stars++;
      }
    }
    
    return stars;
  }

  public endLevel(): void {
    if (this.currentLevel) {
      this.emit('levelEnded', this.currentLevel);
    }
    
    this.currentLevel = null;
    this.currentProgress = null;
    this.patternBuffer = [];
    this.instrumentsUsed.clear();
  }

  public getLevels(): StoryLevel[] {
    return Array.from(this.levels.values());
  }

  public getLevel(id: number): StoryLevel | undefined {
    return this.levels.get(id);
  }

  public getCurrentLevel(): StoryLevel | null {
    return this.currentLevel;
  }

  public getCurrentProgress(): LevelProgress | null {
    return this.currentProgress;
  }

  public getTotalStars(): number {
    return Array.from(this.levels.values()).reduce((total, level) => total + level.stars, 0);
  }

  public reset(): void {
    // Reset all levels except the first
    this.levels.forEach((level, id) => {
      level.completed = false;
      level.stars = 0;
      level.unlocked = id === 1;
      
      level.objectives.forEach(obj => {
        obj.progress = 0;
        obj.completed = false;
      });
    });
    
    this.currentLevel = null;
    this.currentProgress = null;
    this.saveProgress();
    
    this.emit('progressReset');
  }
}