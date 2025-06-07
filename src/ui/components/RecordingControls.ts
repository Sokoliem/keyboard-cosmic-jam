import { GameEngine } from '@game/core/GameEngine';
import { Recording } from '@game/audio/RecordingEngine';

export class RecordingControls {
  private gameEngine: GameEngine;
  private container: HTMLElement;
  private recordButton: HTMLButtonElement;
  private playButton: HTMLButtonElement;
  private stopButton: HTMLButtonElement;
  private recordingsList: HTMLElement;
  private recordingNameInput: HTMLInputElement;
  private statusDisplay: HTMLElement;
  
  private isRecording = false;
  private isPlaying = false;
  private selectedRecording: Recording | null = null;

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
    this.container = this.createContainer();
    this.recordButton = this.createRecordButton();
    this.playButton = this.createPlayButton();
    this.stopButton = this.createStopButton();
    this.recordingNameInput = this.createNameInput();
    this.statusDisplay = this.createStatusDisplay();
    this.recordingsList = this.createRecordingsList();
    
    this.setupLayout();
    this.setupEventListeners();
    this.updateRecordingsList();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'recording-controls';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(26, 26, 26, 0.95);
      border: 2px solid #FF00FF;
      border-radius: 12px;
      padding: 16px;
      font-family: 'Courier New', monospace;
      color: #FFFFFF;
      font-size: 14px;
      box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
      backdrop-filter: blur(10px);
      z-index: 1000;
      max-width: 300px;
      user-select: none;
    `;
    return container;
  }

  private createRecordButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = '🔴 Record';
    button.style.cssText = this.getButtonStyles('#FF0040');
    return button;
  }

  private createPlayButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = '▶️ Play';
    button.style.cssText = this.getButtonStyles('#00FF40');
    button.disabled = true;
    return button;
  }

  private createStopButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = '⏹️ Stop';
    button.style.cssText = this.getButtonStyles('#FFB000');
    button.disabled = true;
    return button;
  }

  private createNameInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Recording name...';
    input.style.cssText = `
      width: 100%;
      padding: 8px;
      margin: 8px 0;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid #00FFFF;
      border-radius: 4px;
      color: #FFFFFF;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    `;
    return input;
  }

  private createStatusDisplay(): HTMLElement {
    const div = document.createElement('div');
    div.style.cssText = `
      margin: 8px 0;
      padding: 8px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 4px;
      font-size: 12px;
      text-align: center;
      border: 1px solid #444;
    `;
    div.textContent = 'Ready to record';
    return div;
  }

  private createRecordingsList(): HTMLElement {
    const div = document.createElement('div');
    div.style.cssText = `
      max-height: 200px;
      overflow-y: auto;
      margin-top: 12px;
      border-top: 1px solid #444;
      padding-top: 12px;
    `;
    return div;
  }

  private getButtonStyles(color: string): string {
    return `
      background: linear-gradient(45deg, ${color}, ${color}88);
      border: 1px solid ${color};
      color: #FFFFFF;
      padding: 8px 16px;
      margin: 4px;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      font-weight: bold;
      transition: all 0.2s ease;
      text-shadow: 0 0 4px rgba(0,0,0,0.8);
      box-shadow: 0 0 8px ${color}44;
    `;
  }

  private setupLayout(): void {
    const title = document.createElement('h3');
    title.textContent = '🎵 Recording Studio';
    title.style.cssText = `
      margin: 0 0 12px 0;
      color: #FF00FF;
      text-align: center;
      text-shadow: 0 0 8px #FF00FF;
    `;

    const hint = document.createElement('div');
    hint.textContent = 'Ctrl+R to toggle';
    hint.style.cssText = `
      font-size: 10px;
      color: #888;
      text-align: center;
      margin-bottom: 8px;
    `;

    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;';
    
    controls.appendChild(this.recordButton);
    controls.appendChild(this.playButton);
    controls.appendChild(this.stopButton);

    this.container.appendChild(title);
    this.container.appendChild(hint);
    this.container.appendChild(this.recordingNameInput);
    this.container.appendChild(controls);
    this.container.appendChild(this.statusDisplay);
    this.container.appendChild(this.recordingsList);

    document.body.appendChild(this.container);
  }

  private setupEventListeners(): void {
    this.recordButton.addEventListener('click', () => {
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    });

    this.playButton.addEventListener('click', () => {
      if (this.isPlaying) {
        this.stopPlayback();
      } else if (this.selectedRecording) {
        this.playRecording();
      }
    });

    this.stopButton.addEventListener('click', () => {
      if (this.isRecording) {
        this.stopRecording();
      } else if (this.isPlaying) {
        this.stopPlayback();
      }
    });

    // Game engine events
    this.gameEngine.on('recordingStarted', () => {
      this.isRecording = true;
      this.updateUI();
    });

    this.gameEngine.on('recordingStopped', (_recording: Recording) => {
      this.isRecording = false;
      this.updateRecordingsList();
      this.updateUI();
    });

    this.gameEngine.on('playbackStarted', () => {
      this.isPlaying = true;
      this.updateUI();
    });

    this.gameEngine.on('playbackStopped', () => {
      this.isPlaying = false;
      this.updateUI();
    });
  }

  private startRecording(): void {
    const name = this.recordingNameInput.value.trim() || undefined;
    if (this.gameEngine.startRecording(name)) {
      this.recordingNameInput.value = '';
    }
  }

  private stopRecording(): void {
    this.gameEngine.stopRecording();
  }

  private playRecording(): void {
    if (this.selectedRecording) {
      this.gameEngine.playRecording(this.selectedRecording);
    }
  }

  private stopPlayback(): void {
    this.gameEngine.stopPlayback();
  }

  private updateUI(): void {
    // Update button states
    this.recordButton.textContent = this.isRecording ? '⏸️ Stop Rec' : '🔴 Record';
    this.recordButton.disabled = this.isPlaying;
    
    this.playButton.disabled = this.isRecording || !this.selectedRecording;
    this.playButton.textContent = this.isPlaying ? '⏸️ Stop Play' : '▶️ Play';
    
    this.stopButton.disabled = !this.isRecording && !this.isPlaying;

    // Update status
    if (this.isRecording) {
      this.statusDisplay.textContent = '🔴 Recording...';
      this.statusDisplay.style.background = 'rgba(255, 0, 64, 0.2)';
    } else if (this.isPlaying) {
      this.statusDisplay.textContent = '▶️ Playing back...';
      this.statusDisplay.style.background = 'rgba(0, 255, 64, 0.2)';
    } else {
      this.statusDisplay.textContent = 'Ready';
      this.statusDisplay.style.background = 'rgba(0, 0, 0, 0.5)';
    }
  }

  private updateRecordingsList(): void {
    this.recordingsList.innerHTML = '';
    
    const recordings = this.gameEngine.getRecordings();
    
    if (recordings.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No recordings yet';
      empty.style.cssText = 'text-align: center; color: #888; font-style: italic; padding: 20px;';
      this.recordingsList.appendChild(empty);
      return;
    }

    recordings.forEach(recording => {
      const item = this.createRecordingItem(recording);
      this.recordingsList.appendChild(item);
    });
  }

  private createRecordingItem(recording: Recording): HTMLElement {
    const item = document.createElement('div');
    item.style.cssText = `
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid #333;
      border-radius: 6px;
      padding: 8px;
      margin: 4px 0;
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    const isSelected = this.selectedRecording?.id === recording.id;
    if (isSelected) {
      item.style.border = '1px solid #00FFFF';
      item.style.background = 'rgba(0, 255, 255, 0.1)';
    }

    const name = document.createElement('div');
    name.textContent = recording.name;
    name.style.cssText = 'font-weight: bold; color: #00FFFF; margin-bottom: 4px;';

    const info = document.createElement('div');
    info.style.cssText = 'font-size: 10px; color: #AAA;';
    info.innerHTML = `
      Duration: ${(recording.duration / 1000).toFixed(1)}s<br>
      Notes: ${recording.notes.length}<br>
      ${new Date(recording.timestamp).toLocaleDateString()}
    `;

    const actions = document.createElement('div');
    actions.style.cssText = 'margin-top: 8px; display: flex; gap: 4px;';

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.style.cssText = this.getButtonStyles('#FF4040');
    deleteBtn.style.fontSize = '10px';
    deleteBtn.style.padding = '4px 6px';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Delete "${recording.name}"?`)) {
        this.gameEngine.deleteRecording(recording.id);
        this.updateRecordingsList();
        if (this.selectedRecording?.id === recording.id) {
          this.selectedRecording = null;
          this.updateUI();
        }
      }
    };

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '💾';
    exportBtn.style.cssText = this.getButtonStyles('#4040FF');
    exportBtn.style.fontSize = '10px';
    exportBtn.style.padding = '4px 6px';
    exportBtn.onclick = (e) => {
      e.stopPropagation();
      this.exportRecording(recording);
    };

    actions.appendChild(deleteBtn);
    actions.appendChild(exportBtn);

    item.appendChild(name);
    item.appendChild(info);
    item.appendChild(actions);

    // Click to select
    item.onclick = () => {
      this.selectedRecording = recording;
      this.updateRecordingsList();
      this.updateUI();
    };

    // Hover effects
    item.onmouseenter = () => {
      if (!isSelected) {
        item.style.background = 'rgba(255, 255, 255, 0.05)';
      }
    };
    item.onmouseleave = () => {
      if (!isSelected) {
        item.style.background = 'rgba(0, 0, 0, 0.3)';
      }
    };

    return item;
  }

  private exportRecording(recording: Recording): void {
    const data = this.gameEngine.exportRecording(recording);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.name.replace(/[^a-zA-Z0-9]/g, '_')}.kcj`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public show(): void {
    this.container.style.display = 'block';
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public toggle(): void {
    const isVisible = this.container.style.display !== 'none';
    if (isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public cleanup(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}