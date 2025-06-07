import { Achievement } from '@game/core/AchievementSystem';

export class AchievementDisplay {
  private container: HTMLElement;
  private badgeContainer: HTMLElement;
  private progressBarContainer: HTMLElement;
  private notificationQueue: Achievement[] = [];
  private isShowingNotification = false;

  constructor() {
    this.container = this.createContainer();
    this.badgeContainer = this.createBadgeContainer();
    this.progressBarContainer = this.createProgressBar();
    
    this.setupLayout();
    this.attachToDOM();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'achievement-display';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 300px;
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #FF00FF;
      border-radius: 10px;
      padding: 15px;
      font-family: 'Courier New', monospace;
      color: #FFFFFF;
      z-index: 1000;
      box-shadow: 0 0 20px #FF00FF;
      transition: transform 0.3s ease;
    `;
    return container;
  }

  private createBadgeContainer(): HTMLElement {
    const badgeContainer = document.createElement('div');
    badgeContainer.className = 'badge-container';
    badgeContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      margin-bottom: 15px;
    `;
    return badgeContainer;
  }

  private createProgressBar(): HTMLElement {
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 100%;
      height: 20px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      overflow: hidden;
      margin-top: 10px;
    `;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #FF00FF, #00FFFF);
      width: 0%;
      transition: width 0.5s ease;
    `;
    
    progressContainer.appendChild(progressBar);
    return progressContainer;
  }

  private setupLayout(): void {
    // Title
    const title = document.createElement('h3');
    title.textContent = 'Achievements';
    title.style.cssText = `
      margin: 0 0 10px 0;
      font-size: 18px;
      color: #FFFF00;
      text-shadow: 0 0 10px #FFFF00;
      text-align: center;
    `;
    
    // Debug: ensure all elements exist
    console.log('Setting up layout:', {
      title: title instanceof HTMLElement,
      badgeContainer: this.badgeContainer instanceof HTMLElement,
      progressBarContainer: this.progressBarContainer instanceof HTMLElement
    });
    
    this.container.appendChild(title);
    this.container.appendChild(this.badgeContainer);
    
    // Safely append progress bar container
    if (this.progressBarContainer && this.progressBarContainer instanceof HTMLElement) {
      this.container.appendChild(this.progressBarContainer);
    } else {
      console.error('Progress bar container is not a valid HTMLElement:', this.progressBarContainer);
    }
  }

  private attachToDOM(): void {
    document.body.appendChild(this.container);
  }

  public updateAchievements(achievements: Achievement[]): void {
    // Clear existing badges
    this.badgeContainer.innerHTML = '';
    
    // Group by category
    const categories = ['beginner', 'intermediate', 'advanced'];
    
    categories.forEach(category => {
      const categoryAchievements = achievements.filter(a => a.category === category);
      
      categoryAchievements.forEach(achievement => {
        const badge = this.createBadge(achievement);
        this.badgeContainer.appendChild(badge);
      });
    });
  }

  private createBadge(achievement: Achievement): HTMLElement {
    const badge = document.createElement('div');
    badge.className = 'achievement-badge';
    badge.title = `${achievement.name}: ${achievement.description}`;
    
    const isUnlocked = achievement.unlocked;
    const progress = achievement.progress / achievement.maxProgress;
    
    badge.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      transition: transform 0.2s ease;
      position: relative;
      ${isUnlocked ? `
        background: linear-gradient(135deg, #FF00FF, #00FFFF);
        box-shadow: 0 0 15px #FF00FF;
      ` : `
        background: rgba(255, 255, 255, 0.1);
        filter: grayscale(1);
        opacity: 0.5;
      `}
    `;
    
    badge.textContent = achievement.icon;
    
    // Add progress ring for locked achievements
    if (!isUnlocked && progress > 0) {
      const progressRing = document.createElement('div');
      progressRing.style.cssText = `
        position: absolute;
        top: -2px;
        left: -2px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 2px solid transparent;
        border-top-color: #FFFF00;
        transform: rotate(${progress * 360}deg);
      `;
      badge.appendChild(progressRing);
    }
    
    // Hover effect
    badge.addEventListener('mouseenter', () => {
      badge.style.transform = 'scale(1.1)';
      this.showTooltip(achievement, badge);
    });
    
    badge.addEventListener('mouseleave', () => {
      badge.style.transform = 'scale(1)';
      this.hideTooltip();
    });
    
    return badge;
  }

  private showTooltip(achievement: Achievement, badge: HTMLElement): void {
    const existingTooltip = document.getElementById('achievement-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
    
    const tooltip = document.createElement('div');
    tooltip.id = 'achievement-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.95);
      border: 1px solid #FF00FF;
      border-radius: 5px;
      padding: 10px;
      margin-bottom: 10px;
      min-width: 200px;
      z-index: 1001;
      pointer-events: none;
    `;
    
    tooltip.innerHTML = `
      <div style="color: #FFFF00; font-weight: bold; margin-bottom: 5px;">${achievement.name}</div>
      <div style="color: #FFFFFF; font-size: 12px; margin-bottom: 5px;">${achievement.description}</div>
      <div style="color: #00FFFF; font-size: 11px;">
        Progress: ${achievement.progress}/${achievement.maxProgress}
        ${achievement.unlocked ? ` - Unlocked ${new Date(achievement.unlockedAt!).toLocaleDateString()}` : ''}
      </div>
    `;
    
    badge.appendChild(tooltip);
  }

  private hideTooltip(): void {
    const tooltip = document.getElementById('achievement-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  public showUnlockNotification(achievement: Achievement): void {
    this.notificationQueue.push(achievement);
    if (!this.isShowingNotification) {
      this.processNotificationQueue();
    }
  }

  private async processNotificationQueue(): Promise<void> {
    if (this.notificationQueue.length === 0) {
      this.isShowingNotification = false;
      return;
    }
    
    this.isShowingNotification = true;
    const achievement = this.notificationQueue.shift()!;
    
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(255, 0, 255, 0.2));
      border: 3px solid #FF00FF;
      border-radius: 15px;
      padding: 30px;
      text-align: center;
      z-index: 2000;
      box-shadow: 0 0 50px #FF00FF;
      animation: achievementPop 0.5s ease forwards;
    `;
    
    notification.innerHTML = `
      <div style="font-size: 60px; margin-bottom: 10px;">${achievement.icon}</div>
      <div style="color: #FFFF00; font-size: 24px; font-weight: bold; margin-bottom: 10px;">
        Achievement Unlocked!
      </div>
      <div style="color: #FFFFFF; font-size: 20px; margin-bottom: 5px;">${achievement.name}</div>
      <div style="color: #00FFFF; font-size: 14px;">${achievement.description}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Play unlock sound if available
    const audio = new Audio();
    audio.volume = 0.5;
    
    // Remove after animation
    setTimeout(() => {
      notification.style.animation = 'achievementFade 0.5s ease forwards';
      setTimeout(() => {
        notification.remove();
        this.processNotificationQueue();
      }, 500);
    }, 2000);
  }

  public updateProgress(progress: number): void {
    const progressBar = this.container.querySelector('.progress-bar') as HTMLElement;
    if (progressBar) {
      progressBar.style.width = `${Math.round(progress * 100)}%`;
    }
  }

  public hide(): void {
    this.container.style.transform = 'translateX(-320px)';
  }

  public show(): void {
    this.container.style.transform = 'translateX(0)';
  }

  public toggleVisibility(): void {
    const isHidden = this.container.style.transform === 'translateX(-320px)';
    if (isHidden) {
      this.show();
    } else {
      this.hide();
    }
  }

  public destroy(): void {
    this.container.remove();
  }
}