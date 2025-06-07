import { StoryLevel, LevelObjective, LevelProgress as Progress } from '@game/modes/StoryMode';

export class LevelProgressDisplay {
  private container: HTMLElement;
  private levelName: HTMLElement;
  private objectivesContainer: HTMLElement;
  private progressBar: HTMLElement;
  private currentLevel: StoryLevel | null = null;

  constructor() {
    this.container = this.createContainer();
    this.levelName = this.createLevelName();
    this.objectivesContainer = this.createObjectivesContainer();
    this.progressBar = this.createProgressBar();
    
    this.setupLayout();
    this.attachToDOM();
    this.hide(); // Start hidden
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'level-progress';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #00FFFF;
      border-radius: 10px;
      padding: 20px;
      min-width: 400px;
      font-family: 'Courier New', monospace;
      color: #FFFFFF;
      z-index: 1000;
      box-shadow: 0 0 20px #00FFFF;
      display: none;
    `;
    return container;
  }

  private createLevelName(): HTMLElement {
    const levelName = document.createElement('h3');
    levelName.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 24px;
      color: #FFFF00;
      text-align: center;
      text-shadow: 0 0 10px #FFFF00;
    `;
    return levelName;
  }

  private createObjectivesContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'objectives';
    container.style.cssText = `
      margin-bottom: 15px;
    `;
    return container;
  }

  private createProgressBar(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      width: 100%;
      height: 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
      overflow: hidden;
      margin-top: 10px;
    `;
    
    const bar = document.createElement('div');
    bar.className = 'progress-fill';
    bar.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #00FFFF, #00FF00);
      width: 0%;
      transition: width 0.3s ease;
    `;
    
    container.appendChild(bar);
    return container;
  }

  private setupLayout(): void {
    this.container.appendChild(this.levelName);
    this.container.appendChild(this.objectivesContainer);
    this.container.appendChild(this.progressBar);
    
    // Add pause button
    const pauseButton = document.createElement('button');
    pauseButton.textContent = '❚❚ Pause';
    pauseButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 5px 10px;
      background: transparent;
      border: 1px solid #FF00FF;
      color: #FF00FF;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    pauseButton.addEventListener('click', () => {
      // Emit pause event
      const event = new CustomEvent('levelPause');
      document.dispatchEvent(event);
    });
    
    this.container.appendChild(pauseButton);
  }

  private attachToDOM(): void {
    document.body.appendChild(this.container);
  }

  public setLevel(level: StoryLevel): void {
    this.currentLevel = level;
    this.levelName.textContent = `${level.name} - Level ${level.id}`;
    this.updateObjectives(level.objectives);
    this.show();
  }

  private updateObjectives(objectives: LevelObjective[]): void {
    this.objectivesContainer.innerHTML = '';
    
    objectives.forEach(objective => {
      const objElement = this.createObjectiveElement(objective);
      this.objectivesContainer.appendChild(objElement);
    });
  }

  private createObjectiveElement(objective: LevelObjective): HTMLElement {
    const element = document.createElement('div');
    element.className = `objective ${objective.completed ? 'completed' : ''}`;
    element.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      padding: 5px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 5px;
      transition: all 0.3s ease;
    `;
    
    // Checkbox
    const checkbox = document.createElement('div');
    checkbox.style.cssText = `
      width: 20px;
      height: 20px;
      border: 2px solid ${objective.completed ? '#00FF00' : '#666666'};
      border-radius: 3px;
      margin-right: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #00FF00;
    `;
    checkbox.textContent = objective.completed ? '✓' : '';
    
    // Description
    const description = document.createElement('span');
    description.textContent = objective.description;
    description.style.cssText = `
      flex: 1;
      font-size: 14px;
      color: ${objective.completed ? '#00FF00' : '#FFFFFF'};
      text-decoration: ${objective.completed ? 'line-through' : 'none'};
    `;
    
    // Progress
    if (!objective.completed && objective.progress > 0) {
      const progress = document.createElement('span');
      const percentage = Math.round((objective.progress / (objective.target as number)) * 100);
      progress.textContent = `${percentage}%`;
      progress.style.cssText = `
        font-size: 12px;
        color: #00FFFF;
        margin-left: 10px;
      `;
      element.appendChild(progress);
    }
    
    element.appendChild(checkbox);
    element.appendChild(description);
    
    return element;
  }

  public updateProgress(level: StoryLevel, _progress: Progress): void {
    if (!this.currentLevel || this.currentLevel.id !== level.id) {
      this.setLevel(level);
    }
    
    // Update objectives
    this.updateObjectives(level.objectives);
    
    // Update overall progress bar
    const completedCount = level.objectives.filter(o => o.completed).length;
    const totalCount = level.objectives.length;
    const percentage = (completedCount / totalCount) * 100;
    
    const progressFill = this.progressBar.querySelector('.progress-fill') as HTMLElement;
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    
    // Flash effect for newly completed objectives
    level.objectives.forEach((obj, index) => {
      if (obj.completed) {
        const objElement = this.objectivesContainer.children[index] as HTMLElement;
        if (objElement && !objElement.classList.contains('completed')) {
          objElement.classList.add('completed');
          this.flashObjective(objElement);
        }
      }
    });
  }

  private flashObjective(element: HTMLElement): void {
    element.style.background = 'rgba(0, 255, 0, 0.3)';
    element.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
      element.style.background = 'rgba(255, 255, 255, 0.05)';
      element.style.transform = 'scale(1)';
    }, 500);
  }

  public showCompletion(stars: number): void {
    // Create completion overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 3000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      text-align: center;
      animation: levelCompletePop 0.5s ease;
    `;
    
    // Title
    const title = document.createElement('h1');
    title.textContent = 'Level Complete!';
    title.style.cssText = `
      font-size: 48px;
      color: #00FF00;
      text-shadow: 0 0 30px #00FF00;
      margin-bottom: 30px;
    `;
    
    // Stars
    const starsContainer = document.createElement('div');
    starsContainer.style.cssText = `
      font-size: 60px;
      margin-bottom: 30px;
    `;
    
    for (let i = 0; i < 3; i++) {
      const star = document.createElement('span');
      star.textContent = '⭐';
      star.style.cssText = `
        opacity: ${i < stars ? '1' : '0.2'};
        animation: starPop ${0.3 + i * 0.2}s ease;
      `;
      starsContainer.appendChild(star);
    }
    
    // Continue button
    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'Continue';
    continueBtn.style.cssText = `
      padding: 15px 40px;
      font-size: 20px;
      background: transparent;
      border: 2px solid #00FF00;
      color: #00FF00;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    
    continueBtn.addEventListener('click', () => {
      overlay.remove();
      this.hide();
      // Return to level select
      const event = new CustomEvent('returnToLevelSelect');
      document.dispatchEvent(event);
    });
    
    content.appendChild(title);
    content.appendChild(starsContainer);
    content.appendChild(continueBtn);
    overlay.appendChild(content);
    
    document.body.appendChild(overlay);
  }

  public show(): void {
    this.container.style.display = 'block';
  }

  public hide(): void {
    this.container.style.display = 'none';
    this.currentLevel = null;
  }

  public destroy(): void {
    this.container.remove();
  }
}