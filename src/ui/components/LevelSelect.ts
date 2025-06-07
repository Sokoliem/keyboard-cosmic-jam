import { StoryLevel } from '@game/modes/StoryMode';
import { GameEngine } from '@game/core/GameEngine';

export class LevelSelect {
  private container: HTMLElement;
  private levelGrid: HTMLElement;
  private gameEngine: GameEngine;
  private isVisible = false;

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
    this.container = this.createContainer();
    this.levelGrid = this.createLevelGrid();
    
    this.setupLayout();
    this.attachToDOM();
    this.hide(); // Start hidden
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'level-select';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    return container;
  }

  private createLevelGrid(): HTMLElement {
    const grid = document.createElement('div');
    grid.className = 'level-grid';
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      max-width: 800px;
      width: 90%;
      padding: 20px;
    `;
    return grid;
  }

  private setupLayout(): void {
    // Title
    const title = document.createElement('h1');
    title.textContent = 'Select Your Adventure';
    title.style.cssText = `
      font-family: 'Courier New', monospace;
      font-size: 48px;
      color: #FFFF00;
      text-shadow: 0 0 20px #FFFF00;
      margin-bottom: 40px;
      text-align: center;
    `;
    
    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back to Menu';
    backButton.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      padding: 10px 20px;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      background: transparent;
      border: 2px solid #FF00FF;
      color: #FF00FF;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    
    backButton.addEventListener('mouseenter', () => {
      backButton.style.background = '#FF00FF';
      backButton.style.color = '#000000';
    });
    
    backButton.addEventListener('mouseleave', () => {
      backButton.style.background = 'transparent';
      backButton.style.color = '#FF00FF';
    });
    
    backButton.addEventListener('click', () => {
      this.hide();
      this.gameEngine.getState().setMode('menu');
    });
    
    this.container.appendChild(backButton);
    this.container.appendChild(title);
    this.container.appendChild(this.levelGrid);
  }

  private attachToDOM(): void {
    document.body.appendChild(this.container);
  }

  public updateLevels(levels: StoryLevel[]): void {
    this.levelGrid.innerHTML = '';
    
    levels.forEach(level => {
      const levelCard = this.createLevelCard(level);
      this.levelGrid.appendChild(levelCard);
    });
  }

  private createLevelCard(level: StoryLevel): HTMLElement {
    const card = document.createElement('div');
    card.className = 'level-card';
    
    const isLocked = !level.unlocked;
    const borderColor = isLocked ? '#666666' : 
                       level.completed ? '#00FF00' : '#FF00FF';
    
    card.style.cssText = `
      background: rgba(0, 0, 0, 0.8);
      border: 3px solid ${borderColor};
      border-radius: 15px;
      padding: 30px;
      cursor: ${isLocked ? 'not-allowed' : 'pointer'};
      transition: all 0.3s ease;
      opacity: ${isLocked ? '0.5' : '1'};
      position: relative;
      overflow: hidden;
    `;
    
    // Level number
    const levelNumber = document.createElement('div');
    levelNumber.textContent = `Level ${level.id}`;
    levelNumber.style.cssText = `
      position: absolute;
      top: 10px;
      right: 15px;
      font-size: 14px;
      color: #00FFFF;
    `;
    
    // Title
    const title = document.createElement('h2');
    title.textContent = level.name;
    title.style.cssText = `
      font-size: 28px;
      color: #FFFF00;
      margin-bottom: 10px;
      text-shadow: 0 0 10px #FFFF00;
    `;
    
    // Description
    const description = document.createElement('p');
    description.textContent = level.description;
    description.style.cssText = `
      font-size: 16px;
      color: #FFFFFF;
      margin-bottom: 20px;
      line-height: 1.4;
    `;
    
    // Objectives
    const objectivesTitle = document.createElement('div');
    objectivesTitle.textContent = 'Objectives:';
    objectivesTitle.style.cssText = `
      font-size: 14px;
      color: #00FFFF;
      margin-bottom: 10px;
    `;
    
    const objectivesList = document.createElement('ul');
    objectivesList.style.cssText = `
      list-style: none;
      padding: 0;
      margin: 0 0 20px 0;
    `;
    
    level.objectives.forEach(obj => {
      const objItem = document.createElement('li');
      const checkmark = obj.completed ? '✓' : '○';
      objItem.textContent = `${checkmark} ${obj.description}`;
      objItem.style.cssText = `
        font-size: 13px;
        color: ${obj.completed ? '#00FF00' : '#CCCCCC'};
        margin-bottom: 5px;
      `;
      objectivesList.appendChild(objItem);
    });
    
    // Stars
    const starsContainer = document.createElement('div');
    starsContainer.style.cssText = `
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    `;
    
    for (let i = 0; i < 3; i++) {
      const star = document.createElement('span');
      star.textContent = i < level.stars ? '⭐' : '☆';
      star.style.cssText = `
        font-size: 24px;
        color: ${i < level.stars ? '#FFFF00' : '#666666'};
      `;
      starsContainer.appendChild(star);
    }
    
    // Play button
    const playButton = document.createElement('button');
    playButton.textContent = isLocked ? '🔒 Locked' : 
                           level.completed ? 'Play Again' : 'Play';
    playButton.style.cssText = `
      width: 100%;
      padding: 12px;
      font-family: 'Courier New', monospace;
      font-size: 18px;
      background: ${isLocked ? '#333333' : 'transparent'};
      border: 2px solid ${borderColor};
      color: ${borderColor};
      cursor: ${isLocked ? 'not-allowed' : 'pointer'};
      transition: all 0.3s ease;
    `;
    
    // Assemble card
    card.appendChild(levelNumber);
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(objectivesTitle);
    card.appendChild(objectivesList);
    card.appendChild(starsContainer);
    card.appendChild(playButton);
    
    // Add interactions
    if (!isLocked) {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'scale(1.02)';
        card.style.boxShadow = `0 0 30px ${borderColor}`;
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'scale(1)';
        card.style.boxShadow = 'none';
      });
      
      playButton.addEventListener('mouseenter', () => {
        playButton.style.background = borderColor;
        playButton.style.color = '#000000';
      });
      
      playButton.addEventListener('mouseleave', () => {
        playButton.style.background = 'transparent';
        playButton.style.color = borderColor;
      });
      
      playButton.addEventListener('click', () => {
        this.startLevel(level.id);
      });
    }
    
    return card;
  }

  private startLevel(levelId: number): void {
    if (this.gameEngine.startStoryLevel(levelId)) {
      this.hide();
    }
  }

  public show(): void {
    this.isVisible = true;
    this.container.style.display = 'flex';
    
    // Update levels before showing
    const storyMode = this.gameEngine.getStoryMode();
    this.updateLevels(storyMode.getLevels());
    
    // Trigger fade in
    setTimeout(() => {
      this.container.style.opacity = '1';
    }, 10);
  }

  public hide(): void {
    this.isVisible = false;
    this.container.style.opacity = '0';
    
    setTimeout(() => {
      this.container.style.display = 'none';
    }, 300);
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  public destroy(): void {
    this.container.remove();
  }
}