import { EventEmitter } from '@utils/EventEmitter';

export interface Unlockable {
  id: string;
  name: string;
  description: string;
  type: 'instrument' | 'effect' | 'sound' | 'theme';
  icon: string;
  requiredLevel?: number;
  requiredAchievements?: string[];
  requiredScore?: number;
  unlocked: boolean;
}

export interface UnlockNotification {
  unlockable: Unlockable;
  reason: string;
  timestamp: number;
}

export class ProgressionSystem extends EventEmitter {
  private unlockables: Map<string, Unlockable> = new Map();
  private unlockedItems: Set<string> = new Set();
  private unlockQueue: UnlockNotification[] = [];
  private isProcessingUnlocks = false;

  // Define all unlockable content
  private readonly UNLOCKABLES: Unlockable[] = [
    // Instruments
    {
      id: 'synthBass',
      name: 'Bass Synth',
      description: 'Deep, groovy bass sounds',
      type: 'instrument',
      icon: '🎸',
      unlocked: true // Start unlocked
    },
    {
      id: 'synthLead',
      name: 'Lead Synth',
      description: 'Bright, cutting lead sounds',
      type: 'instrument',
      icon: '🎹',
      requiredLevel: 1,
      unlocked: false
    },
    {
      id: 'synthPad',
      name: 'Pad Synth',
      description: 'Smooth, ambient pad sounds',
      type: 'instrument',
      icon: '🎨',
      requiredLevel: 3,
      unlocked: false
    },
    {
      id: 'fmBell',
      name: 'Bell Synth',
      description: 'Sparkly, bell-like tones',
      type: 'instrument',
      icon: '🔔',
      requiredLevel: 2,
      unlocked: false
    },
    {
      id: 'digitalDrum',
      name: 'Digital Drums',
      description: 'Punchy electronic drums',
      type: 'instrument',
      icon: '🥁',
      requiredAchievements: ['rhythm-royalty'],
      unlocked: false
    },
    {
      id: 'arpeggiate',
      name: 'Arpeggiator',
      description: 'Automatic musical patterns',
      type: 'instrument',
      icon: '🎼',
      requiredLevel: 4,
      unlocked: false
    },
    
    // Visual Effects
    {
      id: 'disco-lights',
      name: 'Disco Lights',
      description: 'Colorful disco ball effects',
      type: 'effect',
      icon: '🪩',
      requiredLevel: 1,
      unlocked: false
    },
    {
      id: 'animal-particles',
      name: 'Animal Friends',
      description: 'Cute animal particle effects',
      type: 'effect',
      icon: '🦊',
      requiredLevel: 2,
      unlocked: false
    },
    {
      id: 'rainbow-trail',
      name: 'Rainbow Trail',
      description: 'Leave a colorful trail',
      type: 'effect',
      icon: '🌈',
      requiredLevel: 3,
      unlocked: false
    },
    {
      id: 'cosmic-finale',
      name: 'Cosmic Finale',
      description: 'Epic space effects',
      type: 'effect',
      icon: '🌌',
      requiredLevel: 4,
      unlocked: false
    },
    
    // Sound Banks
    {
      id: 'retro-pack',
      name: 'Retro Sounds',
      description: '80s inspired sound pack',
      type: 'sound',
      icon: '📼',
      unlocked: true // Start unlocked
    },
    {
      id: 'nature-pack',
      name: 'Nature Sounds',
      description: 'Birds, water, and forest sounds',
      type: 'sound',
      icon: '🌳',
      requiredAchievements: ['animal-whisperer'],
      unlocked: false
    },
    {
      id: 'silly-pack',
      name: 'Silly Sounds',
      description: 'Funny boings and sproings',
      type: 'sound',
      icon: '🤪',
      requiredScore: 5000,
      unlocked: false
    },
    {
      id: 'world-pack',
      name: 'World Music',
      description: 'Instruments from around the world',
      type: 'sound',
      icon: '🌍',
      requiredAchievements: ['cosmic-conductor'],
      unlocked: false
    },
    
    // Visual Themes
    {
      id: 'neon-theme',
      name: 'Neon Dreams',
      description: 'Classic 80s neon theme',
      type: 'theme',
      icon: '💜',
      unlocked: true // Start unlocked
    },
    {
      id: 'space-theme',
      name: 'Space Odyssey',
      description: 'Journey through the cosmos',
      type: 'theme',
      icon: '🚀',
      requiredLevel: 1,
      unlocked: false
    },
    {
      id: 'nature-theme',
      name: 'Forest Adventure',
      description: 'Natural, earthy visuals',
      type: 'theme',
      icon: '🌲',
      requiredLevel: 2,
      unlocked: false
    },
    {
      id: 'candy-theme',
      name: 'Candy Land',
      description: 'Sweet and colorful theme',
      type: 'theme',
      icon: '🍭',
      requiredAchievements: ['star-collector'],
      unlocked: false
    }
  ];

  constructor() {
    super();
    this.initializeUnlockables();
    this.loadProgress();
  }

  private initializeUnlockables(): void {
    this.UNLOCKABLES.forEach(unlockable => {
      this.unlockables.set(unlockable.id, { ...unlockable });
    });
  }

  private loadProgress(): void {
    try {
      const saved = localStorage.getItem('cosmic-jam-unlocks');
      if (saved) {
        const unlockedIds = JSON.parse(saved);
        unlockedIds.forEach((id: string) => {
          const item = this.unlockables.get(id);
          if (item) {
            item.unlocked = true;
            this.unlockedItems.add(id);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load progression:', error);
    }
  }

  private saveProgress(): void {
    try {
      const unlockedIds = Array.from(this.unlockedItems);
      localStorage.setItem('cosmic-jam-unlocks', JSON.stringify(unlockedIds));
    } catch (error) {
      console.error('Failed to save progression:', error);
    }
  }

  public checkUnlocks(data: {
    level?: number;
    achievements?: string[];
    score?: number;
  }): void {
    const newUnlocks: Unlockable[] = [];
    
    this.unlockables.forEach(unlockable => {
      if (unlockable.unlocked) return;
      
      let shouldUnlock = false;
      let reason = '';
      
      // Check level requirement
      if (unlockable.requiredLevel !== undefined && data.level !== undefined) {
        if (data.level >= unlockable.requiredLevel) {
          shouldUnlock = true;
          reason = `Reached level ${unlockable.requiredLevel}`;
        }
      }
      
      // Check achievement requirements
      if (unlockable.requiredAchievements && data.achievements) {
        const hasAllAchievements = unlockable.requiredAchievements.every(
          reqAchievement => data.achievements!.includes(reqAchievement)
        );
        if (hasAllAchievements) {
          shouldUnlock = true;
          reason = `Earned required achievements`;
        }
      }
      
      // Check score requirement
      if (unlockable.requiredScore !== undefined && data.score !== undefined) {
        if (data.score >= unlockable.requiredScore) {
          shouldUnlock = true;
          reason = `Scored ${unlockable.requiredScore} points`;
        }
      }
      
      if (shouldUnlock) {
        unlockable.unlocked = true;
        this.unlockedItems.add(unlockable.id);
        newUnlocks.push(unlockable);
        
        this.unlockQueue.push({
          unlockable,
          reason,
          timestamp: Date.now()
        });
      }
    });
    
    if (newUnlocks.length > 0) {
      this.saveProgress();
      this.processUnlockQueue();
    }
  }

  private async processUnlockQueue(): Promise<void> {
    if (this.isProcessingUnlocks || this.unlockQueue.length === 0) return;
    
    this.isProcessingUnlocks = true;
    
    while (this.unlockQueue.length > 0) {
      const notification = this.unlockQueue.shift()!;
      this.emit('itemUnlocked', notification);
      
      // Wait a bit between notifications
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.isProcessingUnlocks = false;
  }

  public getUnlockables(type?: string): Unlockable[] {
    const items = Array.from(this.unlockables.values());
    if (type) {
      return items.filter(item => item.type === type);
    }
    return items;
  }

  public getUnlockedItems(type?: string): Unlockable[] {
    return this.getUnlockables(type).filter(item => item.unlocked);
  }

  public getLockedItems(type?: string): Unlockable[] {
    return this.getUnlockables(type).filter(item => !item.unlocked);
  }

  public isUnlocked(id: string): boolean {
    const item = this.unlockables.get(id);
    return item ? item.unlocked : false;
  }

  public getUnlockProgress(): number {
    const total = this.unlockables.size;
    const unlocked = this.unlockedItems.size;
    return total > 0 ? unlocked / total : 0;
  }

  public forceUnlock(id: string): void {
    const item = this.unlockables.get(id);
    if (item && !item.unlocked) {
      item.unlocked = true;
      this.unlockedItems.add(id);
      this.saveProgress();
      
      this.emit('itemUnlocked', {
        unlockable: item,
        reason: 'Manually unlocked',
        timestamp: Date.now()
      });
    }
  }

  public reset(): void {
    // Reset all unlockables except the default ones
    this.unlockables.forEach(unlockable => {
      if (unlockable.id === 'synthBass' || 
          unlockable.id === 'retro-pack' || 
          unlockable.id === 'neon-theme') {
        unlockable.unlocked = true;
      } else {
        unlockable.unlocked = false;
      }
    });
    
    this.unlockedItems.clear();
    this.unlockedItems.add('synthBass');
    this.unlockedItems.add('retro-pack');
    this.unlockedItems.add('neon-theme');
    
    this.saveProgress();
    this.emit('progressionReset');
  }
}