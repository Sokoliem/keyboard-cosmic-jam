import { EventEmitter } from '@utils/EventEmitter';
import * as PIXI from 'pixi.js';
import { SoundConfig } from '@game/audio/AudioEngine';
import { TouchZoneRenderer } from './TouchZoneRenderer';
import { TouchZone } from '@game/core/InputManager';
import { BackgroundEffects } from './BackgroundEffects';
import { ScoreEvent } from '@game/core/ScoringSystem';

export interface VisualEffect {
  id: string;
  type: string;
  position: { x: number; y: number };
  color: number;
  duration: number;
  startTime: number;
  sprite?: PIXI.Container;
  sound?: SoundConfig;
}

export class VisualEngine extends EventEmitter {
  private app: PIXI.Application | null = null;
  private stage: PIXI.Container | null = null;
  private effects: Map<string, VisualEffect> = new Map();
  private particles: PIXI.Container | null = null;
  private background: PIXI.Graphics | null = null;
  private backgroundEffects: BackgroundEffects | null = null;
  private touchZoneRenderer: TouchZoneRenderer | null = null;
  private isInitialized = false;


  constructor() {
    super();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create PIXI application with async initialization
      this.app = new PIXI.Application();
      
      // Initialize the application
      await this.app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x0a0a0a,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      this.stage = this.app.stage;

      // Add canvas to DOM
      const gameContainer = document.getElementById('app');
      if (gameContainer && this.app.canvas) {
        gameContainer.appendChild(this.app.canvas);
        this.app.canvas.style.position = 'absolute';
        this.app.canvas.style.top = '0';
        this.app.canvas.style.left = '0';
        this.app.canvas.style.zIndex = '1';
      }

      // Create background
      this.createBackground();

      // Create background effects (starfield and neon grid)
      this.backgroundEffects = new BackgroundEffects(this.stage);

      // Create particle container for effects
      this.particles = new PIXI.Container();
      this.stage.addChild(this.particles);

      // Create touch zone renderer
      this.touchZoneRenderer = new TouchZoneRenderer(this.stage);

      // Handle window resize
      window.addEventListener('resize', this.handleResize.bind(this));

      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize visual engine:', error);
      throw error;
    }
  }

  private createBackground(): void {
    if (!this.stage) return;

    this.background = new PIXI.Graphics();
    
    // Create animated gradient background
    this.background.beginFill(0x0a0a0a);
    this.background.drawRect(0, 0, window.innerWidth, window.innerHeight);
    this.background.endFill();

    // Add some subtle scanlines for that retro CRT effect
    for (let i = 0; i < window.innerHeight; i += 4) {
      this.background.lineStyle(1, 0x1a1a1a, 0.1);
      this.background.moveTo(0, i);
      this.background.lineTo(window.innerWidth, i);
    }

    this.stage.addChildAt(this.background, 0);
  }

  private handleResize(): void {
    if (!this.app) return;

    this.app.renderer.resize(window.innerWidth, window.innerHeight);
    
    // Recreate background
    if (this.background) {
      this.stage?.removeChild(this.background);
      this.createBackground();
    }

    // Update background effects for new dimensions
    if (this.backgroundEffects) {
      this.backgroundEffects.resize(window.innerWidth, window.innerHeight);
    }
  }

  public triggerKeyEffect(key: string, sound: SoundConfig, scoreEvent?: ScoreEvent): void {
    if (!this.stage) return;

    const position = this.getKeyPosition(key);
    const color = this.hexToPixi(sound.color);

    const effect: VisualEffect = {
      id: `key_${Date.now()}_${Math.random()}`,
      type: 'keyPress',
      position,
      color,
      duration: 1200,
      startTime: performance.now(),
      sound
    };

    // Create visual sprite based on instrument type
    effect.sprite = this.createInstrumentEffect(sound, position, color);
    this.stage.addChild(effect.sprite);
    
    // Add score popup if scoring data provided
    if (scoreEvent) {
      this.createScorePopup(position, scoreEvent);
    }

    this.effects.set(effect.id, effect);
    this.emit('effectStarted', effect);
  }

  public triggerTouchEffect(touch: { x: number; y: number }, sound: SoundConfig, scoreEvent?: ScoreEvent): void {
    if (!this.stage) return;

    const color = this.hexToPixi(sound.color);

    const effect: VisualEffect = {
      id: `touch_${Date.now()}_${Math.random()}`,
      type: 'touch',
      position: touch,
      color,
      duration: 1000,
      startTime: performance.now(),
      sound
    };

    effect.sprite = this.createTouchEffect(touch, color);
    this.stage.addChild(effect.sprite);
    
    // Add score popup if scoring data provided
    if (scoreEvent) {
      this.createScorePopup(touch, scoreEvent);
    }

    this.effects.set(effect.id, effect);
    this.emit('effectStarted', effect);
  }

  private createInstrumentEffect(sound: SoundConfig, position: { x: number; y: number }, color: number): PIXI.Container {
    const container = new PIXI.Container();
    container.x = position.x;
    container.y = position.y;

    switch (sound.instrument) {
      case 'synthBass':
        return this.createBassEffect(container, color);
      case 'synthLead':
        return this.createLeadEffect(container, color);
      case 'synthPad':
        return this.createPadEffect(container, color);
      case 'fmBell':
        return this.createBellEffect(container, color);
      case 'digitalDrum':
        return this.createDrumEffect(container, color, sound.note);
      case 'arpeggiate':
        return this.createArpEffect(container, color);
      default:
        return this.createDefaultEffect(container, color);
    }
  }

  private createBassEffect(container: PIXI.Container, color: number): PIXI.Container {
    // Low frequency waves - expanding rings
    for (let i = 0; i < 3; i++) {
      const ring = new PIXI.Graphics();
      ring.lineStyle(4, color, 0.8);
      ring.drawCircle(0, 0, 30 + i * 15);
      ring.alpha = 0.8 - i * 0.2;
      container.addChild(ring);
    }
    return container;
  }

  private createLeadEffect(container: PIXI.Container, color: number): PIXI.Container {
    // Sharp, pointed star bursts
    const star = new PIXI.Graphics();
    star.beginFill(color, 0.9);
    
    // Draw a star shape
    const points = 8;
    const outerRadius = 40;
    const innerRadius = 20;
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) star.moveTo(x, y);
      else star.lineTo(x, y);
    }
    star.endFill();
    container.addChild(star);

    // Add sparkles
    for (let i = 0; i < 8; i++) {
      const sparkle = new PIXI.Graphics();
      sparkle.beginFill(0xFFFFFF, 0.8);
      sparkle.drawCircle(0, 0, 2);
      sparkle.endFill();
      
      const angle = (i / 8) * Math.PI * 2;
      sparkle.x = Math.cos(angle) * 60;
      sparkle.y = Math.sin(angle) * 60;
      container.addChild(sparkle);
    }
    
    return container;
  }

  private createPadEffect(container: PIXI.Container, color: number): PIXI.Container {
    // Soft, flowing particles
    const numParticles = 12;
    for (let i = 0; i < numParticles; i++) {
      const particle = new PIXI.Graphics();
      particle.beginFill(color, 0.6);
      particle.drawCircle(0, 0, 8);
      particle.endFill();
      
      const angle = (i / numParticles) * Math.PI * 2;
      const radius = 50 + Math.random() * 30;
      particle.x = Math.cos(angle) * radius;
      particle.y = Math.sin(angle) * radius;
      container.addChild(particle);
    }
    return container;
  }

  private createBellEffect(container: PIXI.Container, color: number): PIXI.Container {
    // Crystalline, geometric patterns
    const crystal = new PIXI.Graphics();
    crystal.lineStyle(3, color, 0.9);
    
    // Draw a diamond shape
    crystal.moveTo(0, -40);
    crystal.lineTo(30, 0);
    crystal.lineTo(0, 40);
    crystal.lineTo(-30, 0);
    crystal.lineTo(0, -40);
    
    // Inner diamond
    crystal.moveTo(0, -20);
    crystal.lineTo(15, 0);
    crystal.lineTo(0, 20);
    crystal.lineTo(-15, 0);
    crystal.lineTo(0, -20);
    
    container.addChild(crystal);
    return container;
  }

  private createDrumEffect(container: PIXI.Container, color: number, note: string): PIXI.Container {
    switch (note) {
      case 'kick':
        // Kick - concentric circles expanding outward
        for (let i = 0; i < 4; i++) {
          const circle = new PIXI.Graphics();
          circle.lineStyle(6 - i, color, 0.8 - i * 0.15);
          circle.drawCircle(0, 0, 20 + i * 10);
          container.addChild(circle);
        }
        break;
      case 'snare':
        // Snare - explosive burst
        for (let i = 0; i < 16; i++) {
          const line = new PIXI.Graphics();
          line.lineStyle(3, color, 0.7);
          const angle = (i / 16) * Math.PI * 2;
          line.moveTo(0, 0);
          line.lineTo(Math.cos(angle) * 50, Math.sin(angle) * 50);
          container.addChild(line);
        }
        break;
      case 'hihat':
        // Hi-hat - small sparkly particles
        for (let i = 0; i < 20; i++) {
          const dot = new PIXI.Graphics();
          dot.beginFill(color, 0.8);
          dot.drawCircle(0, 0, 1 + Math.random() * 2);
          dot.endFill();
          dot.x = (Math.random() - 0.5) * 80;
          dot.y = (Math.random() - 0.5) * 80;
          container.addChild(dot);
        }
        break;
      default:
        return this.createDefaultEffect(container, color);
    }
    return container;
  }

  private createArpEffect(container: PIXI.Container, color: number): PIXI.Container {
    // Cascading notes going upward
    for (let i = 0; i < 5; i++) {
      const note = new PIXI.Graphics();
      note.beginFill(color, 0.8 - i * 0.1);
      note.drawRect(-8, -4, 16, 8);
      note.endFill();
      note.y = -i * 20;
      note.x = i * 10;
      container.addChild(note);
    }
    return container;
  }

  private createTouchEffect(position: { x: number; y: number }, color: number): PIXI.Container {
    const container = new PIXI.Container();
    container.x = position.x;
    container.y = position.y;

    // Touch ripple effect
    for (let i = 0; i < 3; i++) {
      const ring = new PIXI.Graphics();
      ring.lineStyle(3, color, 0.6);
      ring.drawCircle(0, 0, 25 + i * 15);
      container.addChild(ring);
    }

    return container;
  }

  private createDefaultEffect(container: PIXI.Container, color: number): PIXI.Container {
    const circle = new PIXI.Graphics();
    circle.beginFill(color, 0.7);
    circle.drawCircle(0, 0, 30);
    circle.endFill();
    container.addChild(circle);
    return container;
  }

  private getKeyPosition(key: string): { x: number; y: number } {
    // Map keyboard keys to screen positions
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Create a QWERTY-like layout on screen
    const keyRows: Record<string, { x: number; y: number }> = {
      // Number row
      '1': { x: width * 0.1, y: height * 0.2 },
      '2': { x: width * 0.2, y: height * 0.2 },
      '3': { x: width * 0.3, y: height * 0.2 },
      '4': { x: width * 0.4, y: height * 0.2 },
      '5': { x: width * 0.5, y: height * 0.2 },
      
      // Top row (QWERTY)
      'q': { x: width * 0.15, y: height * 0.35 },
      'w': { x: width * 0.25, y: height * 0.35 },
      'e': { x: width * 0.35, y: height * 0.35 },
      'r': { x: width * 0.45, y: height * 0.35 },
      't': { x: width * 0.55, y: height * 0.35 },
      'y': { x: width * 0.65, y: height * 0.35 },
      'u': { x: width * 0.75, y: height * 0.35 },
      'i': { x: width * 0.85, y: height * 0.35 },
      
      // Home row (ASDF)
      'a': { x: width * 0.2, y: height * 0.5 },
      's': { x: width * 0.3, y: height * 0.5 },
      'd': { x: width * 0.4, y: height * 0.5 },
      'f': { x: width * 0.5, y: height * 0.5 },
      'g': { x: width * 0.6, y: height * 0.5 },
      'h': { x: width * 0.7, y: height * 0.5 },
      'j': { x: width * 0.8, y: height * 0.5 },
      'k': { x: width * 0.9, y: height * 0.5 },
      
      // Bottom row (ZXCV)
      'z': { x: width * 0.25, y: height * 0.65 },
      'x': { x: width * 0.35, y: height * 0.65 },
      'c': { x: width * 0.45, y: height * 0.65 },
      'v': { x: width * 0.55, y: height * 0.65 },
      'b': { x: width * 0.65, y: height * 0.65 },
      'n': { x: width * 0.75, y: height * 0.65 },
      'm': { x: width * 0.85, y: height * 0.65 },
      
      // Special keys
      ' ': { x: width * 0.5, y: height * 0.8 },
      'enter': { x: width * 0.9, y: height * 0.65 }
    };

    return keyRows[key.toLowerCase()] || { x: width * 0.5, y: height * 0.5 };
  }

  private hexToPixi(hexColor: string): number {
    // Convert hex color string to PIXI number format
    return parseInt(hexColor.replace('#', ''), 16);
  }

  public updateTouchZones(touchZones: TouchZone[]): void {
    if (this.touchZoneRenderer) {
      this.touchZoneRenderer.updateLayout(touchZones);
    }
  }

  public showTouchZones(touchZones: TouchZone[]): void {
    if (this.touchZoneRenderer) {
      this.touchZoneRenderer.renderTouchZones(touchZones);
      this.touchZoneRenderer.autoManageVisibility();
    }
  }

  public hideTouchZones(): void {
    if (this.touchZoneRenderer) {
      this.touchZoneRenderer.hideZones();
    }
  }

  public toggleTouchZones(): void {
    if (this.touchZoneRenderer) {
      this.touchZoneRenderer.toggleZones();
    }
  }

  public highlightTouchZone(zoneId: string): void {
    if (this.touchZoneRenderer) {
      this.touchZoneRenderer.highlightZone(zoneId);
    }
  }

  // Background Effects Control
  public setStarfieldEnabled(enabled: boolean): void {
    if (this.backgroundEffects) {
      this.backgroundEffects.setStarfieldEnabled(enabled);
    }
  }

  public setNeonGridEnabled(enabled: boolean): void {
    if (this.backgroundEffects) {
      this.backgroundEffects.setNeonGridEnabled(enabled);
    }
  }

  public setStarCount(count: number): void {
    if (this.backgroundEffects) {
      this.backgroundEffects.setStarCount(count);
    }
  }

  public update(deltaTime: number): void {
    if (!this.stage) return;

    // Update background effects
    if (this.backgroundEffects) {
      this.backgroundEffects.update(deltaTime);
    }

    // Update and animate effects
    const currentTime = performance.now();
    const completedEffects: string[] = [];

    this.effects.forEach((effect, id) => {
      const elapsed = currentTime - effect.startTime;
      const progress = Math.min(elapsed / effect.duration, 1);

      if (progress >= 1) {
        completedEffects.push(id);
      } else {
        this.animateEffect(effect, progress, deltaTime);
      }
    });

    // Remove completed effects
    completedEffects.forEach(id => {
      const effect = this.effects.get(id);
      if (effect?.sprite && this.stage) {
        this.stage.removeChild(effect.sprite);
      }
      this.effects.delete(id);
      this.emit('effectComplete', id);
    });
  }

  private animateEffect(effect: VisualEffect, progress: number, deltaTime: number): void {
    if (!effect.sprite) return;

    const sprite = effect.sprite;
    const easeOut = 1 - Math.pow(1 - progress, 3); // Smooth easing

    switch (effect.type) {
      case 'keyPress':
        // Scale up and fade out
        const scale = 0.5 + easeOut * 1.5;
        sprite.scale.set(scale);
        sprite.alpha = 1 - progress;
        
        // Add rotation for some instrument types
        if (effect.sound?.instrument === 'synthLead' || effect.sound?.instrument === 'arpeggiate') {
          sprite.rotation += deltaTime * 0.01;
        }
        
        // Pulse for bass effects
        if (effect.sound?.instrument === 'synthBass') {
          const pulse = 1 + Math.sin(progress * Math.PI * 8) * 0.1;
          sprite.scale.set(scale * pulse);
        }
        break;
        
      case 'touch':
        // Expanding ripple
        const rippleScale = 1 + progress * 3;
        sprite.scale.set(rippleScale);
        sprite.alpha = 1 - progress;
        break;
    }

    // Add some subtle floating motion
    sprite.y += Math.sin(progress * Math.PI * 2) * 0.5;
  }

  public removeEffect(effectId: string): void {
    const effect = this.effects.get(effectId);
    if (effect?.sprite && this.stage) {
      this.stage.removeChild(effect.sprite);
    }
    this.effects.delete(effectId);
  }

  public cleanup(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    // Clean up all effects
    this.effects.forEach(effect => {
      if (effect.sprite && this.stage) {
        this.stage.removeChild(effect.sprite);
      }
    });
    this.effects.clear();

    // Clean up background effects
    if (this.backgroundEffects) {
      this.backgroundEffects.cleanup();
      this.backgroundEffects = null;
    }

    // Clean up touch zone renderer
    if (this.touchZoneRenderer) {
      this.touchZoneRenderer.cleanup();
      this.touchZoneRenderer = null;
    }

    // Destroy PIXI application
    if (this.app) {
      this.app.destroy(true, {
        children: true,
        texture: true
      });
    }

    this.app = null;
    this.stage = null;
    this.particles = null;
    this.background = null;
    this.isInitialized = false;
  }
  
  // Scoring-related visual effects
  private createScorePopup(position: { x: number; y: number }, scoreEvent: ScoreEvent): void {
    if (!this.stage) return;
    
    const container = new PIXI.Container();
    container.x = position.x;
    container.y = position.y - 50; // Above the key effect
    
    // Create score text
    const scoreText = new PIXI.Text(`+${scoreEvent.totalPoints}`, {
      fontFamily: 'Arial',
      fontSize: 32,
      fontWeight: 'bold',
      fill: 0xFFFF00,
      stroke: { color: 0x000000, width: 4 },
      align: 'center'
    });
    scoreText.anchor.set(0.5);
    container.addChild(scoreText);
    
    // Add combo indicator if > 1
    if (scoreEvent.combo > 1) {
      const comboText = new PIXI.Text(`${scoreEvent.combo}x`, {
        fontFamily: 'Arial',
        fontSize: 20,
        fontWeight: 'bold',
        fill: this.getComboColor(scoreEvent.combo),
        stroke: { color: 0x000000, width: 3 },
        align: 'center'
      });
      comboText.anchor.set(0.5);
      comboText.y = -25;
      container.addChild(comboText);
    }
    
    // Add accuracy indicator
    if (scoreEvent.accuracy > 0.9) {
      const perfectText = new PIXI.Text('PERFECT!', {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0x00FF00,
        stroke: { color: 0x000000, width: 2 },
        align: 'center'
      });
      perfectText.anchor.set(0.5);
      perfectText.y = 25;
      container.addChild(perfectText);
    }
    
    this.stage.addChild(container);
    
    // Animate the popup
    const startY = container.y;
    const targetY = startY - 100;
    const duration = 1500;
    const startTime = performance.now();
    
    const animatePopup = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        container.destroy();
        return;
      }
      
      // Move up and fade out
      container.y = startY + (targetY - startY) * progress;
      container.alpha = 1 - progress;
      
      requestAnimationFrame(animatePopup);
    };
    
    requestAnimationFrame(animatePopup);
  }
  
  private getComboColor(combo: number): number {
    if (combo >= 30) return 0xFF00FF; // Rainbow/Magenta
    if (combo >= 20) return 0xFF0000; // Fire Red
    if (combo >= 10) return 0xFF8800; // Hot Orange
    if (combo >= 5) return 0xFFFF00;  // Warm Yellow
    return 0xFFFFFF; // Normal White
  }
  
  public triggerMultiplierEffect(data: { combo: number; multiplier: number; name: string }): void {
    if (!this.stage) return;
    
    // Create fullscreen flash effect
    const flash = new PIXI.Graphics();
    flash.beginFill(this.getComboColor(data.combo), 0.3);
    flash.drawRect(0, 0, window.innerWidth, window.innerHeight);
    flash.endFill();
    
    this.stage.addChild(flash);
    
    // Create multiplier announcement
    const container = new PIXI.Container();
    container.x = window.innerWidth / 2;
    container.y = window.innerHeight / 2;
    
    const multiplierText = new PIXI.Text(`${data.multiplier}x MULTIPLIER!`, {
      fontFamily: 'Arial',
      fontSize: 64,
      fontWeight: 'bold',
      fill: this.getComboColor(data.combo),
      stroke: { color: 0x000000, width: 6 },
      align: 'center'
    });
    multiplierText.anchor.set(0.5);
    container.addChild(multiplierText);
    
    const nameText = new PIXI.Text(data.name.toUpperCase(), {
      fontFamily: 'Arial',
      fontSize: 32,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      stroke: { color: 0x000000, width: 4 },
      align: 'center'
    });
    nameText.anchor.set(0.5);
    nameText.y = 50;
    container.addChild(nameText);
    
    this.stage.addChild(container);
    
    // Animate
    const duration = 2000;
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        flash.destroy();
        container.destroy();
        return;
      }
      
      // Flash fade out
      flash.alpha = 0.3 * (1 - progress);
      
      // Text scale and rotate
      const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
      container.scale.set(scale);
      container.rotation = Math.sin(progress * Math.PI * 4) * 0.1;
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }
  
  public triggerCelebrationEffect(data: { type: string; value: number; name: string }): void {
    if (!this.stage || !this.particles) return;
    
    // Create particle burst
    const particleCount = 50;
    const colors = [0xFF00FF, 0x00FFFF, 0xFFFF00, 0xFF00AA, 0x00FF00];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new PIXI.Graphics();
      const color = colors[Math.floor(Math.random() * colors.length)];
      particle.beginFill(color);
      particle.drawRect(-2, -2, 4, 4);
      particle.endFill();
      
      particle.x = window.innerWidth / 2;
      particle.y = window.innerHeight / 2;
      
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 5 + Math.random() * 10;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      this.particles.addChild(particle);
      
      // Animate particle
      const animateParticle = () => {
        particle.x += vx;
        particle.y += vy;
        particle.alpha -= 0.02;
        
        if (particle.alpha <= 0) {
          particle.destroy();
        } else {
          requestAnimationFrame(animateParticle);
        }
      };
      
      requestAnimationFrame(animateParticle);
    }
    
    // Create achievement text
    const achievementText = new PIXI.Text(data.name, {
      fontFamily: 'Arial',
      fontSize: 72,
      fontWeight: 'bold',
      fill: [0xFF00FF, 0x00FFFF, 0xFFFF00],
      stroke: { color: 0x000000, width: 8 },
      align: 'center',
      dropShadow: {
        alpha: 1,
        angle: Math.PI / 4,
        blur: 4,
        color: 0x000000,
        distance: 4
      }
    });
    
    achievementText.anchor.set(0.5);
    achievementText.x = window.innerWidth / 2;
    achievementText.y = window.innerHeight / 3;
    achievementText.scale.set(0);
    
    this.stage.addChild(achievementText);
    
    // Animate achievement text
    const duration = 3000;
    const startTime = performance.now();
    
    const animateText = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        achievementText.destroy();
        return;
      }
      
      // Scale in, then scale out
      if (progress < 0.2) {
        const scaleProgress = progress / 0.2;
        achievementText.scale.set(scaleProgress * 1.2);
      } else if (progress < 0.8) {
        achievementText.scale.set(1.2);
      } else {
        const fadeProgress = (progress - 0.8) / 0.2;
        achievementText.scale.set(1.2 * (1 - fadeProgress));
        achievementText.alpha = 1 - fadeProgress;
      }
      
      // Gentle rotation
      achievementText.rotation = Math.sin(progress * Math.PI * 2) * 0.05;
      
      requestAnimationFrame(animateText);
    };
    
    requestAnimationFrame(animateText);
  }
  
  public setTheme(theme: string): void {
    if (!this.backgroundEffects) return;
    
    // Configure visual theme based on story level
    switch (theme) {
      case 'disco':
        this.backgroundEffects.setStarfieldEnabled(true);
        this.backgroundEffects.setNeonGridEnabled(true);
        this.backgroundEffects.setStarCount(200);
        // Add disco-specific effects later
        break;
        
      case 'zoo':
        this.backgroundEffects.setStarfieldEnabled(true);
        this.backgroundEffects.setNeonGridEnabled(false);
        this.backgroundEffects.setStarCount(100);
        // Add animal-themed effects later
        break;
        
      case 'rainbow':
        this.backgroundEffects.setStarfieldEnabled(true);
        this.backgroundEffects.setNeonGridEnabled(false);
        this.backgroundEffects.setStarCount(150);
        // Add rainbow effects later
        break;
        
      case 'cosmic':
        this.backgroundEffects.setStarfieldEnabled(true);
        this.backgroundEffects.setNeonGridEnabled(true);
        this.backgroundEffects.setStarCount(300);
        // Add cosmic effects later
        break;
        
      default:
        // Default theme
        this.backgroundEffects.setStarfieldEnabled(true);
        this.backgroundEffects.setNeonGridEnabled(true);
        this.backgroundEffects.setStarCount(100);
    }
    
    this.emit('themeChanged', theme);
  }
}