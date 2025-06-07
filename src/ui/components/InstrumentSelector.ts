import { ProgressionSystem, Unlockable } from '@game/core/ProgressionSystem';
import { GameEngine } from '@game/core/GameEngine';

export class InstrumentSelector {
  private container: HTMLElement;
  private instrumentGrid: HTMLElement;
  private gameEngine: GameEngine;
  private progressionSystem: ProgressionSystem;
  private selectedInstrument: string = 'synthBass';
  private isVisible = false;

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
    this.progressionSystem = gameEngine.getProgressionSystem();
    
    this.container = this.createContainer();
    this.instrumentGrid = this.createInstrumentGrid();
    
    this.setupLayout();
    this.attachToDOM();
    this.updateInstruments();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'instrument-selector';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #00FFFF;
      border-radius: 15px;
      padding: 15px;
      font-family: 'Courier New', monospace;
      color: #FFFFFF;
      z-index: 1500;
      box-shadow: 0 0 30px #00FFFF;
      transition: transform 0.3s ease, opacity 0.3s ease;
      opacity: 0;
      transform: translateX(-50%) translateY(100%);
    `;
    return container;
  }

  private createInstrumentGrid(): HTMLElement {
    const grid = document.createElement('div');
    grid.className = 'instrument-grid';
    grid.style.cssText = `
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: center;
    `;
    return grid;
  }

  private setupLayout(): void {
    // Title
    const title = document.createElement('div');
    title.textContent = 'Select Instrument';
    title.style.cssText = `
      text-align: center;
      font-size: 14px;
      color: #FFFF00;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    `;
    
    // Help text
    const helpText = document.createElement('div');
    helpText.textContent = 'Press I to toggle • Number keys to select';
    helpText.style.cssText = `
      text-align: center;
      font-size: 11px;
      color: #888888;
      margin-top: 10px;
    `;
    
    this.container.appendChild(title);
    this.container.appendChild(this.instrumentGrid);
    this.container.appendChild(helpText);
  }

  private attachToDOM(): void {
    document.body.appendChild(this.container);
    
    // Add keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        this.toggle();
      }
      
      // Number keys for quick selection
      if (this.isVisible && e.key >= '1' && e.key <= '6') {
        const index = parseInt(e.key) - 1;
        const instruments = this.progressionSystem.getUnlockedItems('instrument');
        if (instruments[index]) {
          this.selectInstrument(instruments[index].id);
        }
      }
    });
  }

  private updateInstruments(): void {
    this.instrumentGrid.innerHTML = '';
    
    const instruments = this.progressionSystem.getUnlockables('instrument');
    
    instruments.forEach((instrument, index) => {
      const button = this.createInstrumentButton(instrument, index + 1);
      this.instrumentGrid.appendChild(button);
    });
  }

  private createInstrumentButton(instrument: Unlockable, number: number): HTMLElement {
    const button = document.createElement('button');
    button.className = 'instrument-button';
    
    const isSelected = instrument.id === this.selectedInstrument;
    const isLocked = !instrument.unlocked;
    
    button.style.cssText = `
      width: 80px;
      height: 80px;
      background: ${isLocked ? 'rgba(50, 50, 50, 0.5)' : 'rgba(0, 0, 0, 0.8)'};
      border: 2px solid ${isSelected ? '#FFFF00' : isLocked ? '#666666' : '#00FFFF'};
      border-radius: 10px;
      cursor: ${isLocked ? 'not-allowed' : 'pointer'};
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
      position: relative;
      opacity: ${isLocked ? '0.5' : '1'};
    `;
    
    // Instrument icon
    const icon = document.createElement('div');
    icon.textContent = instrument.icon;
    icon.style.cssText = `
      font-size: 32px;
      filter: ${isLocked ? 'grayscale(1)' : 'none'};
    `;
    
    // Instrument name
    const name = document.createElement('div');
    name.textContent = instrument.name;
    name.style.cssText = `
      font-size: 10px;
      color: ${isSelected ? '#FFFF00' : '#FFFFFF'};
      text-align: center;
      line-height: 1.2;
    `;
    
    // Number indicator
    const numberEl = document.createElement('div');
    numberEl.textContent = number.toString();
    numberEl.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      font-size: 12px;
      color: #888888;
    `;
    
    // Lock icon if locked
    if (isLocked) {
      const lock = document.createElement('div');
      lock.textContent = '🔒';
      lock.style.cssText = `
        position: absolute;
        bottom: 5px;
        right: 5px;
        font-size: 16px;
      `;
      button.appendChild(lock);
    }
    
    button.appendChild(icon);
    button.appendChild(name);
    button.appendChild(numberEl);
    
    // Selection glow
    if (isSelected) {
      button.style.boxShadow = '0 0 20px #FFFF00';
    }
    
    // Interactions
    if (!isLocked) {
      button.addEventListener('mouseenter', () => {
        if (!isSelected) {
          button.style.transform = 'scale(1.05)';
          button.style.borderColor = '#FFFF00';
        }
      });
      
      button.addEventListener('mouseleave', () => {
        if (!isSelected) {
          button.style.transform = 'scale(1)';
          button.style.borderColor = '#00FFFF';
        }
      });
      
      button.addEventListener('click', () => {
        this.selectInstrument(instrument.id);
      });
    } else {
      // Show unlock requirements on hover
      button.title = this.getUnlockRequirement(instrument);
    }
    
    return button;
  }

  private getUnlockRequirement(instrument: Unlockable): string {
    if (instrument.requiredLevel) {
      return `Unlocks at Level ${instrument.requiredLevel}`;
    }
    if (instrument.requiredAchievements) {
      return `Requires achievements: ${instrument.requiredAchievements.join(', ')}`;
    }
    if (instrument.requiredScore) {
      return `Score ${instrument.requiredScore} points to unlock`;
    }
    return 'Locked';
  }

  private selectInstrument(instrumentId: string): void {
    this.selectedInstrument = instrumentId;
    
    // Update audio engine
    this.gameEngine.getAudioEngine().setCurrentInstrument(instrumentId);
    
    // Update UI
    this.updateInstruments();
    
    // Visual feedback
    this.flashSelection();
    
    // Update game state
    this.gameEngine.getState().updateSettings({ instrument: instrumentId });
    
    this.emit('instrumentChanged', instrumentId);
  }

  private flashSelection(): void {
    const originalOpacity = this.container.style.opacity;
    this.container.style.opacity = '0.5';
    setTimeout(() => {
      this.container.style.opacity = originalOpacity;
    }, 100);
  }

  public show(): void {
    this.isVisible = true;
    this.updateInstruments(); // Refresh in case of new unlocks
    
    this.container.style.display = 'block';
    // Force reflow
    this.container.offsetHeight;
    
    this.container.style.opacity = '1';
    this.container.style.transform = 'translateX(-50%) translateY(0)';
  }

  public hide(): void {
    this.isVisible = false;
    
    this.container.style.opacity = '0';
    this.container.style.transform = 'translateX(-50%) translateY(100%)';
    
    setTimeout(() => {
      this.container.style.display = 'none';
    }, 300);
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public getCurrentInstrument(): string {
    return this.selectedInstrument;
  }

  private emit(event: string, data: any): void {
    const customEvent = new CustomEvent(event, { detail: data });
    document.dispatchEvent(customEvent);
  }

  public destroy(): void {
    this.container.remove();
  }
}