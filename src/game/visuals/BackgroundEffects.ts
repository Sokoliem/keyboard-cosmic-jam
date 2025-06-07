import * as PIXI from 'pixi.js';

export class BackgroundEffects {
  private stage: PIXI.Container;
  private starfield: PIXI.Container;
  private neonGrid: PIXI.Container;
  private stars: Star[] = [];
  private gridLines: PIXI.Graphics[] = [];
  private time = 0;

  // Configurable effects
  public starfieldEnabled = true;
  public neonGridEnabled = true;
  public starCount = 200;
  public gridSpacing = 50;

  constructor(stage: PIXI.Container) {
    this.stage = stage;
    this.starfield = new PIXI.Container();
    this.neonGrid = new PIXI.Container();
    
    // Add to stage at the very back
    this.stage.addChildAt(this.starfield, 0);
    this.stage.addChildAt(this.neonGrid, 1);
    
    this.initializeEffects();
  }

  private initializeEffects(): void {
    this.createStarfield();
    this.createNeonGrid();
  }

  private createStarfield(): void {
    for (let i = 0; i < this.starCount; i++) {
      const star = new Star();
      star.reset(window.innerWidth, window.innerHeight);
      this.stars.push(star);
      this.starfield.addChild(star.sprite);
    }
  }

  private createNeonGrid(): void {
    this.updateNeonGrid();
  }

  private updateNeonGrid(): void {
    // Clear existing grid
    this.gridLines.forEach(line => {
      if (line.parent) {
        line.parent.removeChild(line);
      }
      line.destroy();
    });
    this.gridLines = [];

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Create perspective grid
    this.createPerspectiveGrid(width, height);
  }

  private createPerspectiveGrid(width: number, height: number): void {
    const grid = new PIXI.Graphics();
    
    // Grid colors with transparency
    const primaryColor = 0x00FFFF;
    const secondaryColor = 0xFF00FF;
    
    // Horizon line (about 60% down the screen)
    const horizonY = height * 0.6;
    
    // Vertical lines (perspective)
    const numVerticalLines = 20;
    for (let i = 0; i <= numVerticalLines; i++) {
      const x = (i / numVerticalLines) * width;
      const alpha = Math.abs(i - numVerticalLines/2) / (numVerticalLines/2);
      
      grid.lineStyle(1, primaryColor, 0.3 * (1 - alpha * 0.7));
      grid.moveTo(x, horizonY);
      
      // Perspective point
      const centerX = width / 2;
      const perspectiveX = centerX + (x - centerX) * 0.1;
      grid.lineTo(perspectiveX, height);
    }

    // Horizontal lines (depth)
    const numHorizontalLines = 15;
    for (let i = 0; i < numHorizontalLines; i++) {
      const progress = i / numHorizontalLines;
      const y = horizonY + (height - horizonY) * Math.pow(progress, 1.5);
      const alpha = 0.5 * (1 - progress);
      
      // Line gets narrower towards the horizon
      const lineWidth = progress * width * 0.8 + width * 0.1;
      const startX = (width - lineWidth) / 2;
      const endX = startX + lineWidth;
      
      grid.lineStyle(Math.max(1, 3 - progress * 2), secondaryColor, alpha);
      grid.moveTo(startX, y);
      grid.lineTo(endX, y);
    }

    this.neonGrid.addChild(grid);
    this.gridLines.push(grid);
  }

  public update(deltaTime: number): void {
    this.time += deltaTime * 0.001; // Convert to seconds

    if (this.starfieldEnabled) {
      this.updateStarfield(deltaTime);
    }

    if (this.neonGridEnabled) {
      this.updateGridAnimation();
    }
  }

  private updateStarfield(deltaTime: number): void {
    this.stars.forEach(star => {
      star.update(deltaTime, window.innerWidth, window.innerHeight);
    });
  }

  private updateGridAnimation(): void {
    // Animate grid with subtle movement and color cycling
    this.gridLines.forEach((grid, index) => {
      grid.alpha = 0.8 + Math.sin(this.time * 2 + index) * 0.2;
      
      // Subtle vertical movement
      grid.y = Math.sin(this.time * 0.5 + index * 0.5) * 2;
    });
  }

  public resize(width: number, height: number): void {
    // Reset stars for new dimensions
    this.stars.forEach(star => {
      star.reset(width, height);
    });

    // Recreate grid for new dimensions
    this.updateNeonGrid();
  }

  public setStarfieldEnabled(enabled: boolean): void {
    this.starfieldEnabled = enabled;
    this.starfield.visible = enabled;
  }

  public setNeonGridEnabled(enabled: boolean): void {
    this.neonGridEnabled = enabled;
    this.neonGrid.visible = enabled;
  }

  public setStarCount(count: number): void {
    if (count === this.starCount) return;
    
    // Remove excess stars
    while (this.stars.length > count) {
      const star = this.stars.pop();
      if (star) {
        this.starfield.removeChild(star.sprite);
        star.destroy();
      }
    }

    // Add new stars
    while (this.stars.length < count) {
      const star = new Star();
      star.reset(window.innerWidth, window.innerHeight);
      this.stars.push(star);
      this.starfield.addChild(star.sprite);
    }

    this.starCount = count;
  }

  public cleanup(): void {
    this.stars.forEach(star => star.destroy());
    this.stars = [];
    
    this.gridLines.forEach(line => line.destroy());
    this.gridLines = [];

    if (this.starfield.parent) {
      this.starfield.parent.removeChild(this.starfield);
    }
    if (this.neonGrid.parent) {
      this.neonGrid.parent.removeChild(this.neonGrid);
    }

    this.starfield.destroy();
    this.neonGrid.destroy();
  }
}

class Star {
  public sprite: PIXI.Graphics;
  private x: number = 0;
  private y: number = 0;
  private z: number = 1000;
  private speed: number;
  private color: number;
  private size: number;

  constructor() {
    this.sprite = new PIXI.Graphics();
    this.speed = Math.random() * 300 + 100; // Speed varies
    this.color = this.getRandomStarColor();
    this.size = Math.random() * 2 + 0.5;
  }

  private getRandomStarColor(): number {
    const colors = [
      0xFFFFFF, // White
      0x00FFFF, // Cyan
      0xFF00FF, // Magenta
      0xFFFF00, // Yellow
      0xFF8000, // Orange
      0x8000FF, // Purple
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  public reset(screenWidth: number, screenHeight: number): void {
    this.x = (Math.random() - 0.5) * 2000;
    this.y = (Math.random() - 0.5) * 2000;
    this.z = Math.random() * 1000 + 100;
    this.updateSprite(screenWidth, screenHeight);
  }

  public update(deltaTime: number, screenWidth: number, screenHeight: number): void {
    // Move towards viewer
    this.z -= this.speed * deltaTime * 0.001;

    // Reset if too close
    if (this.z <= 0) {
      this.z = 1000;
      this.x = (Math.random() - 0.5) * 2000;
      this.y = (Math.random() - 0.5) * 2000;
      this.color = this.getRandomStarColor();
    }

    this.updateSprite(screenWidth, screenHeight);
  }

  private updateSprite(screenWidth: number, screenHeight: number): void {
    // Project 3D position to 2D screen
    const focalLength = 200;
    const scale = focalLength / (focalLength + this.z);
    
    const screenX = (this.x * scale) + screenWidth / 2;
    const screenY = (this.y * scale) + screenHeight / 2;

    // Skip if outside screen bounds (with margin)
    if (screenX < -50 || screenX > screenWidth + 50 || 
        screenY < -50 || screenY > screenHeight + 50) {
      this.sprite.visible = false;
      return;
    }

    this.sprite.visible = true;
    this.sprite.x = screenX;
    this.sprite.y = screenY;

    // Size and brightness based on distance
    const starSize = this.size * scale * 2;
    const alpha = Math.min(1, (1000 - this.z) / 1000);

    // Draw the star
    this.sprite.clear();
    this.sprite.beginFill(this.color, alpha);
    this.sprite.drawCircle(0, 0, starSize);
    this.sprite.endFill();

    // Add twinkle effect for closer stars
    if (this.z < 200) {
      const twinkle = Math.sin(Date.now() * 0.01 + this.x * 0.01) * 0.3 + 0.7;
      this.sprite.alpha = alpha * twinkle;
    } else {
      this.sprite.alpha = alpha;
    }
  }

  public destroy(): void {
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
    this.sprite.destroy();
  }
}