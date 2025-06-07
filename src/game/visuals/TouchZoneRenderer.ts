import * as PIXI from 'pixi.js';
import { TouchZone } from '@game/core/InputManager';

export class TouchZoneRenderer {
  private container: PIXI.Container;
  private zones: PIXI.Graphics[] = [];
  private labels: PIXI.Text[] = [];
  private isVisible = false;

  constructor(stage: PIXI.Container) {
    this.container = new PIXI.Container();
    this.container.alpha = 0.8;
    this.container.zIndex = 100; // Above other graphics
    stage.addChild(this.container);
  }

  public renderTouchZones(touchZones: TouchZone[]): void {
    this.clearZones();
    
    touchZones.forEach(zone => {
      this.createZoneVisual(zone);
    });
    
    this.showZones();
  }

  private createZoneVisual(zone: TouchZone): void {
    // Create zone background
    const zoneGraphic = new PIXI.Graphics();
    
    // Convert hex color to PIXI format
    const color = parseInt(zone.color?.replace('#', '') || 'FF00FF', 16);
    
    // Semi-transparent zone with border
    zoneGraphic.beginFill(color, 0.2);
    zoneGraphic.lineStyle(2, color, 0.8);
    zoneGraphic.drawRoundedRect(
      zone.bounds.x, 
      zone.bounds.y, 
      zone.bounds.width, 
      zone.bounds.height, 
      8
    );
    zoneGraphic.endFill();

    // Add subtle glow effect
    const glow = new PIXI.Graphics();
    glow.beginFill(color, 0.1);
    glow.drawRoundedRect(
      zone.bounds.x - 2, 
      zone.bounds.y - 2, 
      zone.bounds.width + 4, 
      zone.bounds.height + 4, 
      10
    );
    glow.endFill();

    this.container.addChild(glow);
    this.container.addChild(zoneGraphic);
    this.zones.push(zoneGraphic, glow);

    // Create label text
    if (zone.label) {
      const text = new PIXI.Text(zone.label, {
        fontFamily: 'monospace',
        fontSize: Math.min(zone.bounds.width / 6, zone.bounds.height / 3, 16),
        fill: 0xFFFFFF,
        align: 'center',
        fontWeight: 'bold',
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 4,
          blur: 1,
          color: 0x000000,
          distance: 1
        }
      });

      text.anchor.set(0.5);
      text.x = zone.bounds.x + zone.bounds.width / 2;
      text.y = zone.bounds.y + zone.bounds.height / 2;

      this.container.addChild(text);
      this.labels.push(text);
    }
  }

  private clearZones(): void {
    this.zones.forEach(zone => {
      if (zone.parent) {
        zone.parent.removeChild(zone);
      }
      zone.destroy();
    });
    
    this.labels.forEach(label => {
      if (label.parent) {
        label.parent.removeChild(label);
      }
      label.destroy();
    });

    this.zones = [];
    this.labels = [];
  }

  public showZones(): void {
    this.isVisible = true;
    this.container.visible = true;
    
    // Animate fade-in
    this.container.alpha = 0;
    this.animateAlpha(0.7, 300);
  }

  public hideZones(): void {
    this.isVisible = false;
    
    // Animate fade-out
    this.animateAlpha(0, 300, () => {
      this.container.visible = false;
    });
  }

  public toggleZones(): void {
    if (this.isVisible) {
      this.hideZones();
    } else {
      this.showZones();
    }
  }

  private animateAlpha(targetAlpha: number, duration: number, onComplete?: () => void): void {
    const startAlpha = this.container.alpha;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      this.container.alpha = startAlpha + (targetAlpha - startAlpha) * easedProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.container.alpha = targetAlpha;
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(animate);
  }

  public highlightZone(zoneId: string): void {
    // Find and highlight a specific zone (for feedback)
    const zoneIndex = this.zones.findIndex((_, index) => 
      this.zones[index * 2]?.name === zoneId
    );
    
    if (zoneIndex >= 0 && this.zones[zoneIndex]) {
      const zone = this.zones[zoneIndex];
      const originalAlpha = zone.alpha;
      
      // Quick flash effect
      zone.alpha = 1;
      setTimeout(() => {
        zone.alpha = originalAlpha;
      }, 150);
    }
  }

  public updateLayout(touchZones: TouchZone[]): void {
    if (this.isVisible) {
      this.renderTouchZones(touchZones);
    }
  }

  public cleanup(): void {
    this.clearZones();
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy();
  }

  // Detect if we're on a mobile device
  public static isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.screen.width <= 1024 && 'ontouchstart' in window);
  }

  // Auto-show zones on mobile, hide on desktop with keyboard
  public autoManageVisibility(): void {
    if (TouchZoneRenderer.isMobileDevice()) {
      this.showZones();
    } else {
      this.hideZones();
    }
  }
}