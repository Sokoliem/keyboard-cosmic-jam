import { ScoreState } from '@game/core/ScoringSystem';

export class ScoreDisplay {
  private container: HTMLElement;
  private scoreElement: HTMLElement;
  private comboElement: HTMLElement;
  private multiplierElement: HTMLElement;
  private accuracyElement: HTMLElement;

  constructor() {
    this.container = this.createContainer();
    this.scoreElement = this.createElement('score');
    this.comboElement = this.createElement('combo');
    this.multiplierElement = this.createElement('multiplier');
    this.accuracyElement = this.createElement('accuracy');
    
    this.setupLayout();
    this.attachToDOM();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'score-display';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #FF00FF;
      border-radius: 10px;
      padding: 20px;
      font-family: 'Courier New', monospace;
      color: #FFFFFF;
      z-index: 1000;
      min-width: 200px;
      box-shadow: 0 0 20px #FF00FF;
    `;
    return container;
  }

  private createElement(type: string): HTMLElement {
    const element = document.createElement('div');
    element.className = `score-${type}`;
    
    const styles: Record<string, string> = {
      score: `
        font-size: 32px;
        font-weight: bold;
        color: #FFFF00;
        text-shadow: 0 0 10px #FFFF00;
        margin-bottom: 10px;
      `,
      combo: `
        font-size: 24px;
        color: #00FFFF;
        text-shadow: 0 0 8px #00FFFF;
        margin-bottom: 5px;
      `,
      multiplier: `
        font-size: 20px;
        color: #FF00FF;
        text-shadow: 0 0 6px #FF00FF;
        margin-bottom: 5px;
      `,
      accuracy: `
        font-size: 16px;
        color: #00FF00;
        text-shadow: 0 0 4px #00FF00;
      `
    };
    
    element.style.cssText = styles[type] || '';
    return element;
  }

  private setupLayout(): void {
    this.scoreElement.textContent = 'Score: 0';
    this.comboElement.textContent = 'Combo: 0';
    this.multiplierElement.textContent = 'Multiplier: 1x';
    this.accuracyElement.textContent = 'Accuracy: 100%';
    
    this.container.appendChild(this.scoreElement);
    this.container.appendChild(this.comboElement);
    this.container.appendChild(this.multiplierElement);
    this.container.appendChild(this.accuracyElement);
  }

  private attachToDOM(): void {
    document.body.appendChild(this.container);
  }

  public update(scoreState: ScoreState): void {
    this.scoreElement.textContent = `Score: ${scoreState.totalScore.toLocaleString()}`;
    this.comboElement.textContent = `Combo: ${scoreState.currentCombo}`;
    this.multiplierElement.textContent = `Multiplier: ${scoreState.multiplier}x`;
    this.accuracyElement.textContent = `Accuracy: ${scoreState.accuracy}%`;
    
    // Add animation effects based on combo
    if (scoreState.currentCombo > 0) {
      this.comboElement.style.animation = 'pulse 0.5s ease-in-out';
      setTimeout(() => {
        this.comboElement.style.animation = '';
      }, 500);
    }
    
    // Change multiplier color based on value
    const multiplierColors: Record<number, string> = {
      1: '#FFFFFF',
      1.5: '#FFFF00',
      2: '#FF8800',
      3: '#FF0000',
      5: '#FF00FF'
    };
    
    this.multiplierElement.style.color = multiplierColors[scoreState.multiplier] || '#FFFFFF';
    this.multiplierElement.style.textShadow = `0 0 6px ${multiplierColors[scoreState.multiplier] || '#FFFFFF'}`;
  }

  public showComboBreak(previousCombo: number): void {
    if (previousCombo < 5) return;
    
    const breakText = document.createElement('div');
    breakText.textContent = `Combo Lost: ${previousCombo}`;
    breakText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 24px;
      color: #FF0000;
      font-weight: bold;
      text-shadow: 0 0 10px #FF0000;
      animation: fadeOut 2s ease-out forwards;
    `;
    
    this.container.appendChild(breakText);
    setTimeout(() => breakText.remove(), 2000);
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public show(): void {
    this.container.style.display = 'block';
  }

  public destroy(): void {
    this.container.remove();
  }
}