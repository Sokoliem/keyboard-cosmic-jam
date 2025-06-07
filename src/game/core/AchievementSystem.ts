import { EventEmitter } from '@utils/EventEmitter';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  condition: AchievementCondition;
}

export interface AchievementCondition {
  type: 'noteCount' | 'combo' | 'accuracy' | 'time' | 'instrument' | 'level' | 'score' | 'custom';
  target: number;
  comparison?: 'gte' | 'lte' | 'eq';
  metadata?: any;
}

export class AchievementSystem extends EventEmitter {
  private achievements: Map<string, Achievement> = new Map();
  private stats = {
    totalNotesPlayed: 0,
    maxCombo: 0,
    totalPlayTime: 0,
    instrumentsUsed: new Set<string>(),
    levelsCompleted: new Set<number>(),
    highScore: 0,
    perfectNotes: 0,
    sessionsPlayed: 0,
    recordingsMade: 0,
  };

  // Achievement definitions
  private readonly definitions: AchievementDefinition[] = [
    // Beginner Badges (Ages 3-4)
    {
      id: 'first-note',
      name: 'First Note',
      description: 'Play your first key',
      icon: '🌟',
      category: 'beginner',
      condition: { type: 'noteCount', target: 1, comparison: 'gte' }
    },
    {
      id: 'key-explorer',
      name: 'Key Explorer',
      description: 'Try 10 different keys',
      icon: '🎹',
      category: 'beginner',
      condition: { type: 'noteCount', target: 10, comparison: 'gte' }
    },
    {
      id: 'rainbow-fingers',
      name: 'Rainbow Fingers',
      description: 'Play 50 notes',
      icon: '🌈',
      category: 'beginner',
      condition: { type: 'noteCount', target: 50, comparison: 'gte' }
    },
    {
      id: 'music-maker',
      name: 'Music Maker',
      description: 'Play for 1 minute',
      icon: '🎵',
      category: 'beginner',
      condition: { type: 'time', target: 60, comparison: 'gte' }
    },
    {
      id: 'space-starter',
      name: 'Space Starter',
      description: 'Complete Space Disco level',
      icon: '🚀',
      category: 'beginner',
      condition: { type: 'level', target: 1, comparison: 'gte' }
    },

    // Intermediate Badges (Ages 4-5)
    {
      id: 'combo-master',
      name: 'Combo Master',
      description: 'Get a 20-note combo',
      icon: '🔥',
      category: 'intermediate',
      condition: { type: 'combo', target: 20, comparison: 'gte' }
    },
    {
      id: 'instrument-switcher',
      name: 'Instrument Switcher',
      description: 'Use 3 different instruments',
      icon: '🎼',
      category: 'intermediate',
      condition: { type: 'instrument', target: 3, comparison: 'gte' }
    },
    {
      id: 'animal-whisperer',
      name: 'Animal Whisperer',
      description: 'Complete Neon Zoo level',
      icon: '🎪',
      category: 'intermediate',
      condition: { type: 'level', target: 2, comparison: 'gte' }
    },
    {
      id: 'star-collector',
      name: 'Star Collector',
      description: 'Earn 1000 total points',
      icon: '💫',
      category: 'intermediate',
      condition: { type: 'score', target: 1000, comparison: 'gte' }
    },
    {
      id: 'color-creator',
      name: 'Color Creator',
      description: 'Complete Rainbow Road level',
      icon: '🎨',
      category: 'intermediate',
      condition: { type: 'level', target: 3, comparison: 'gte' }
    },

    // Advanced Badges (Ages 5-6)
    {
      id: 'rhythm-royalty',
      name: 'Rhythm Royalty',
      description: 'Get 50 perfect notes',
      icon: '🏆',
      category: 'advanced',
      condition: { type: 'accuracy', target: 50, comparison: 'gte' }
    },
    {
      id: 'performance-pro',
      name: 'Performance Pro',
      description: 'Make 5 recordings',
      icon: '🎭',
      category: 'advanced',
      condition: { type: 'custom', target: 5, comparison: 'gte', metadata: { stat: 'recordingsMade' } }
    },
    {
      id: 'cosmic-conductor',
      name: 'Cosmic Conductor',
      description: 'Complete all story levels',
      icon: '🌟',
      category: 'advanced',
      condition: { type: 'level', target: 4, comparison: 'gte' }
    },
    {
      id: 'diamond-fingers',
      name: 'Diamond Fingers',
      description: 'Get a 50-note combo',
      icon: '💎',
      category: 'advanced',
      condition: { type: 'combo', target: 50, comparison: 'gte' }
    },
    {
      id: 'rock-star',
      name: 'Rock Star',
      description: 'Unlock all instruments',
      icon: '🎸',
      category: 'advanced',
      condition: { type: 'instrument', target: 6, comparison: 'gte' }
    }
  ];

  constructor() {
    super();
    this.initializeAchievements();
    this.loadProgress();
  }

  private initializeAchievements(): void {
    this.definitions.forEach(def => {
      this.achievements.set(def.id, {
        ...def,
        progress: 0,
        maxProgress: def.condition.target,
        unlocked: false
      });
    });
  }

  private loadProgress(): void {
    try {
      const saved = localStorage.getItem('cosmic-jam-achievements');
      if (saved) {
        const data = JSON.parse(saved);
        
        // Load stats
        if (data.stats) {
          this.stats = {
            ...this.stats,
            ...data.stats,
            instrumentsUsed: new Set(data.stats.instrumentsUsed || []),
            levelsCompleted: new Set(data.stats.levelsCompleted || [])
          };
        }
        
        // Load achievement progress
        if (data.achievements) {
          data.achievements.forEach((savedAchievement: any) => {
            const achievement = this.achievements.get(savedAchievement.id);
            if (achievement) {
              achievement.progress = savedAchievement.progress;
              achievement.unlocked = savedAchievement.unlocked;
              achievement.unlockedAt = savedAchievement.unlockedAt;
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to load achievement progress:', error);
    }
  }

  private saveProgress(): void {
    try {
      const data = {
        stats: {
          ...this.stats,
          instrumentsUsed: Array.from(this.stats.instrumentsUsed),
          levelsCompleted: Array.from(this.stats.levelsCompleted)
        },
        achievements: Array.from(this.achievements.values()).map(achievement => ({
          id: achievement.id,
          progress: achievement.progress,
          unlocked: achievement.unlocked,
          unlockedAt: achievement.unlockedAt
        }))
      };
      
      localStorage.setItem('cosmic-jam-achievements', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save achievement progress:', error);
    }
  }

  public updateStats(statUpdates: Partial<typeof this.stats>): void {
    // Update numeric stats
    if (statUpdates.totalNotesPlayed !== undefined) {
      this.stats.totalNotesPlayed += statUpdates.totalNotesPlayed;
    }
    if (statUpdates.maxCombo !== undefined && statUpdates.maxCombo > this.stats.maxCombo) {
      this.stats.maxCombo = statUpdates.maxCombo;
    }
    if (statUpdates.totalPlayTime !== undefined) {
      this.stats.totalPlayTime += statUpdates.totalPlayTime;
    }
    if (statUpdates.highScore !== undefined && statUpdates.highScore > this.stats.highScore) {
      this.stats.highScore = statUpdates.highScore;
    }
    if (statUpdates.perfectNotes !== undefined) {
      this.stats.perfectNotes += statUpdates.perfectNotes;
    }
    if (statUpdates.sessionsPlayed !== undefined) {
      this.stats.sessionsPlayed += statUpdates.sessionsPlayed;
    }
    if (statUpdates.recordingsMade !== undefined) {
      this.stats.recordingsMade += statUpdates.recordingsMade;
    }
    
    // Check all achievements for progress
    this.checkAllAchievements();
  }

  public notePlayedWithAccuracy(accuracy: number): void {
    this.stats.totalNotesPlayed++;
    if (accuracy > 0.9) {
      this.stats.perfectNotes++;
    }
    this.checkAllAchievements();
  }

  public comboReached(combo: number): void {
    if (combo > this.stats.maxCombo) {
      this.stats.maxCombo = combo;
      this.checkAllAchievements();
    }
  }

  public instrumentUsed(instrument: string): void {
    this.stats.instrumentsUsed.add(instrument);
    this.checkAllAchievements();
  }

  public levelCompleted(levelNumber: number): void {
    this.stats.levelsCompleted.add(levelNumber);
    this.checkAllAchievements();
  }

  public recordingMade(): void {
    this.stats.recordingsMade++;
    this.checkAllAchievements();
  }

  public scoreReached(score: number): void {
    if (score > this.stats.highScore) {
      this.stats.highScore = score;
      this.checkAllAchievements();
    }
  }

  private checkAllAchievements(): void {
    const newlyUnlocked: Achievement[] = [];
    
    this.achievements.forEach(achievement => {
      if (!achievement.unlocked) {
        const progress = this.calculateProgress(achievement);
        achievement.progress = progress;
        
        if (progress >= achievement.maxProgress) {
          achievement.unlocked = true;
          achievement.unlockedAt = Date.now();
          newlyUnlocked.push(achievement);
        }
      }
    });
    
    if (newlyUnlocked.length > 0) {
      this.saveProgress();
      newlyUnlocked.forEach(achievement => {
        this.emit('achievementUnlocked', achievement);
      });
    }
  }

  private calculateProgress(achievement: Achievement): number {
    const definition = this.definitions.find(d => d.id === achievement.id);
    if (!definition) return 0;
    
    const condition = definition.condition;
    
    switch (condition.type) {
      case 'noteCount':
        return Math.min(this.stats.totalNotesPlayed, condition.target);
        
      case 'combo':
        return Math.min(this.stats.maxCombo, condition.target);
        
      case 'accuracy':
        return Math.min(this.stats.perfectNotes, condition.target);
        
      case 'time':
        return Math.min(Math.floor(this.stats.totalPlayTime / 1000), condition.target);
        
      case 'instrument':
        return Math.min(this.stats.instrumentsUsed.size, condition.target);
        
      case 'level':
        return Math.min(this.stats.levelsCompleted.size, condition.target);
        
      case 'score':
        return Math.min(this.stats.highScore, condition.target);
        
      case 'custom':
        if (condition.metadata?.stat === 'recordingsMade') {
          return Math.min(this.stats.recordingsMade, condition.target);
        }
        return 0;
        
      default:
        return 0;
    }
  }

  public getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  public getAchievementsByCategory(category: 'beginner' | 'intermediate' | 'advanced'): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => a.category === category);
  }

  public getUnlockedAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => a.unlocked);
  }

  public getAchievementProgress(achievementId: string): number {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return 0;
    return achievement.maxProgress > 0 ? achievement.progress / achievement.maxProgress : 0;
  }

  public getStats() {
    return {
      ...this.stats,
      instrumentsUsed: Array.from(this.stats.instrumentsUsed),
      levelsCompleted: Array.from(this.stats.levelsCompleted)
    };
  }

  public getTotalProgress(): number {
    const total = this.achievements.size;
    const unlocked = this.getUnlockedAchievements().length;
    return total > 0 ? unlocked / total : 0;
  }

  public reset(): void {
    this.stats = {
      totalNotesPlayed: 0,
      maxCombo: 0,
      totalPlayTime: 0,
      instrumentsUsed: new Set(),
      levelsCompleted: new Set(),
      highScore: 0,
      perfectNotes: 0,
      sessionsPlayed: 0,
      recordingsMade: 0,
    };
    
    this.achievements.forEach(achievement => {
      achievement.progress = 0;
      achievement.unlocked = false;
      achievement.unlockedAt = undefined;
    });
    
    this.saveProgress();
    this.emit('achievementsReset');
  }
}