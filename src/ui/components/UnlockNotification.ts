import { UnlockNotification as Notification } from '@game/core/ProgressionSystem';

export class UnlockNotification {
  private container: HTMLElement;
  private queue: Notification[] = [];
  private isShowing = false;

  constructor() {
    this.container = this.createContainer();
    this.attachToDOM();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'unlock-notification';
    container.style.cssText = `
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(255, 0, 255, 0.3));
      border: 3px solid #FF00FF;
      border-radius: 15px;
      padding: 20px 40px;
      min-width: 300px;
      text-align: center;
      font-family: 'Courier New', monospace;
      color: #FFFFFF;
      z-index: 2500;
      opacity: 0;
      pointer-events: none;
      box-shadow: 0 0 50px #FF00FF, inset 0 0 20px rgba(255, 0, 255, 0.3);
      display: none;
    `;
    return container;
  }

  private attachToDOM(): void {
    document.body.appendChild(this.container);
  }

  public show(notification: Notification): void {
    this.queue.push(notification);
    if (!this.isShowing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isShowing = false;
      return;
    }

    this.isShowing = true;
    const notification = this.queue.shift()!;
    
    // Update content
    this.container.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 15px;">${notification.unlockable.icon}</div>
      <div style="font-size: 14px; color: #FFFF00; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;">
        NEW ${notification.unlockable.type.toUpperCase()} UNLOCKED!
      </div>
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px; text-shadow: 0 0 10px currentColor;">
        ${notification.unlockable.name}
      </div>
      <div style="font-size: 14px; color: #00FFFF; opacity: 0.9;">
        ${notification.unlockable.description}
      </div>
      <div style="font-size: 12px; color: #FF00FF; margin-top: 10px; font-style: italic;">
        ${notification.reason}
      </div>
    `;
    
    // Show with animation
    this.container.style.display = 'block';
    
    // Force reflow
    this.container.offsetHeight;
    
    // Animate in
    this.container.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    this.container.style.opacity = '1';
    this.container.style.transform = 'translateX(-50%) translateY(0)';
    
    // Add particles effect
    this.createParticles();
    
    // Wait for display duration
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Animate out
    this.container.style.transition = 'all 0.3s ease-in';
    this.container.style.opacity = '0';
    this.container.style.transform = 'translateX(-50%) translateY(-20px)';
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Hide and process next
    this.container.style.display = 'none';
    
    // Small delay between notifications
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.processQueue();
  }

  private createParticles(): void {
    const particleCount = 20;
    const rect = this.container.getBoundingClientRect();
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: ${Math.random() > 0.5 ? '#FF00FF' : '#00FFFF'};
        border-radius: 50%;
        pointer-events: none;
        z-index: 2499;
      `;
      
      // Start from notification center
      particle.style.left = `${rect.left + rect.width / 2}px`;
      particle.style.top = `${rect.top + rect.height / 2}px`;
      
      document.body.appendChild(particle);
      
      // Animate outward
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 100 + Math.random() * 100;
      const duration = 1000 + Math.random() * 500;
      
      particle.animate([
        {
          transform: 'translate(-50%, -50%) scale(1)',
          opacity: '1'
        },
        {
          transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px)) scale(0)`,
          opacity: '0'
        }
      ], {
        duration: duration,
        easing: 'cubic-bezier(0, 0.5, 0.5, 1)'
      });
      
      // Remove after animation
      setTimeout(() => particle.remove(), duration);
    }
  }

  public destroy(): void {
    this.container.remove();
  }
}