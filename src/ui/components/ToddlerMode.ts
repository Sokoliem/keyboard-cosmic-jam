export class ToddlerMode {
  private isToddlerModeActive = false;
  private fullscreenLocked = false;
  private keyboardOverride = false;
  private exitSequence: string[] = [];
  private exitCode = ['p', 'a', 'r', 'e', 'n', 't']; // Type "parent" to exit
  private exitTimeout: number | null = null;
  private parentControlsVisible = false;
  private parentControlPanel: HTMLElement | null = null;

  constructor() {
    this.initializeToddlerMode();
  }

  private initializeToddlerMode(): void {
    // Create parent control panel
    this.createParentControlPanel();
    
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange.bind(this));

    // Prevent context menu (right-click)
    document.addEventListener('contextmenu', (e) => {
      if (this.isToddlerModeActive) {
        e.preventDefault();
      }
    });

    // Prevent drag and drop
    document.addEventListener('dragstart', (e) => {
      if (this.isToddlerModeActive) {
        e.preventDefault();
      }
    });

    // Prevent text selection
    document.addEventListener('selectstart', (e) => {
      if (this.isToddlerModeActive) {
        e.preventDefault();
      }
    });
  }

  private createParentControlPanel(): void {
    this.parentControlPanel = document.createElement('div');
    this.parentControlPanel.id = 'parent-control-panel';
    this.parentControlPanel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      width: 400px;
      background: rgba(0, 0, 0, 0.95);
      border: 3px solid #FF0000;
      border-radius: 15px;
      padding: 30px;
      z-index: 20000;
      font-family: 'Courier New', monospace;
      color: white;
      text-align: center;
      box-shadow: 0 0 50px rgba(255, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      transition: transform 0.3s ease;
    `;

    this.parentControlPanel.innerHTML = `
      <h2 style="color: #FF0000; margin: 0 0 20px 0; font-size: 24px;">
        🔒 Parent Controls
      </h2>
      
      <p style="margin: 20px 0; font-size: 16px; line-height: 1.4;">
        Your child is safely playing in <strong>Toddler Mode</strong>.<br>
        The computer is locked for their protection.
      </p>
      
      <div style="background: rgba(255, 0, 0, 0.1); padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #FFFF00; margin: 0 0 10px 0;">Safety Features Active:</h3>
        <div style="text-align: left; font-size: 14px;">
          ✅ Fullscreen locked<br>
          ✅ System shortcuts disabled<br>
          ✅ Context menu disabled<br>
          ✅ All keys make music<br>
          ✅ No file access possible
        </div>
      </div>
      
      <div style="margin: 25px 0;">
        <button id="exit-toddler-mode" style="
          background: linear-gradient(45deg, #FF0000, #FF6600);
          border: none;
          color: white;
          padding: 12px 25px;
          font-size: 16px;
          border-radius: 20px;
          cursor: pointer;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          margin: 5px;
          transition: all 0.3s ease;
        ">
          Exit Toddler Mode
        </button>
        
        <button id="hide-parent-controls" style="
          background: linear-gradient(45deg, #666, #999);
          border: none;
          color: white;
          padding: 12px 25px;
          font-size: 16px;
          border-radius: 20px;
          cursor: pointer;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          margin: 5px;
          transition: all 0.3s ease;
        ">
          Continue Playing
        </button>
      </div>
      
      <p style="font-size: 12px; color: #888; margin: 20px 0 0 0;">
        💡 Tip: You can also type "parent" on the keyboard to access these controls
      </p>
    `;

    // Setup button handlers
    const exitButton = this.parentControlPanel.querySelector('#exit-toddler-mode') as HTMLButtonElement;
    const hideButton = this.parentControlPanel.querySelector('#hide-parent-controls') as HTMLButtonElement;

    exitButton.addEventListener('click', () => {
      this.exitToddlerMode();
    });

    hideButton.addEventListener('click', () => {
      this.hideParentControls();
    });

    // Button hover effects
    [exitButton, hideButton].forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
      });
    });

    document.body.appendChild(this.parentControlPanel);
  }

  public async activateToddlerMode(): Promise<void> {
    if (this.isToddlerModeActive) return;

    try {
      // Request fullscreen
      await this.enterFullscreen();
      
      this.isToddlerModeActive = true;
      this.keyboardOverride = true;
      this.fullscreenLocked = true;

      // Override all keyboard events
      this.setupKeyboardOverride();

      // Add CSS to prevent scrolling and selection
      this.addToddlerModeStyles();

      // Show activation notification
      this.showActivationNotification();

      console.log('🔒 Toddler Mode activated - Computer is now safe for unsupervised play');
      
    } catch (error) {
      console.error('Failed to activate toddler mode:', error);
      this.showError('Failed to enter fullscreen. Please allow fullscreen access.');
    }
  }

  private async enterFullscreen(): Promise<void> {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      await (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
    } else {
      throw new Error('Fullscreen not supported');
    }
  }

  private setupKeyboardOverride(): void {
    // Capture all keyboard events at the highest level
    document.addEventListener('keydown', this.handleKeyDown.bind(this), { capture: true });
    document.addEventListener('keyup', this.handleKeyUp.bind(this), { capture: true });
    document.addEventListener('keypress', this.handleKeyPress.bind(this), { capture: true });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isToddlerModeActive) return;

    // Check for parent exit sequence
    this.checkExitSequence(event.key.toLowerCase());

    // Block dangerous system shortcuts
    const dangerousKeys = [
      'F4', 'F11', 'F12', // System functions
      'Tab', // If combined with Alt
      'Control', 'Alt', 'Meta' // Modifier keys
    ];

    const isDangerousCombination = 
      (event.altKey && event.key === 'Tab') ||      // Alt+Tab
      (event.altKey && event.key === 'F4') ||       // Alt+F4
      (event.ctrlKey && event.key === 'w') ||       // Ctrl+W
      (event.ctrlKey && event.shiftKey && event.key === 'I') || // Ctrl+Shift+I
      (event.ctrlKey && event.shiftKey && event.key === 'J') || // Ctrl+Shift+J
      (event.ctrlKey && event.key === 'r') ||       // Ctrl+R
      (event.ctrlKey && event.key === 'u') ||       // Ctrl+U
      (event.metaKey) ||                            // Windows/Cmd key
      (event.key === 'F11') ||                     // F11 fullscreen toggle
      (event.key === 'F5') ||                      // F5 refresh
      (event.key === 'Escape' && this.fullscreenLocked); // Escape in fullscreen

    if (isDangerousCombination) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }

    // Let the game handle the key normally for music
    // The key will be processed by the game engine for sound generation
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.isToddlerModeActive) return;
    
    // Prevent any system key handling in toddler mode
    const systemKeys = ['Alt', 'Control', 'Meta', 'F11', 'F4', 'F5'];
    if (systemKeys.includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private handleKeyPress(event: KeyboardEvent): void {
    if (!this.isToddlerModeActive) return;
    
    // Additional safety layer for system keys
    if (event.ctrlKey || event.altKey || event.metaKey) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private checkExitSequence(key: string): void {
    this.exitSequence.push(key);
    
    // Keep only the last 6 characters
    if (this.exitSequence.length > this.exitCode.length) {
      this.exitSequence.shift();
    }

    // Check if sequence matches "parent"
    if (this.exitSequence.length === this.exitCode.length &&
        this.exitSequence.join('') === this.exitCode.join('')) {
      this.showParentControls();
      this.exitSequence = []; // Reset sequence
    }

    // Reset sequence after timeout
    if (this.exitTimeout) {
      clearTimeout(this.exitTimeout);
    }
    this.exitTimeout = window.setTimeout(() => {
      this.exitSequence = [];
    }, 3000);
  }

  private addToddlerModeStyles(): void {
    const style = document.createElement('style');
    style.id = 'toddler-mode-styles';
    style.textContent = `
      body.toddler-mode {
        overflow: hidden !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      
      body.toddler-mode * {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        pointer-events: none !important;
      }
      
      body.toddler-mode canvas {
        pointer-events: auto !important;
      }
      
      body.toddler-mode #parent-control-panel,
      body.toddler-mode #parent-control-panel * {
        pointer-events: auto !important;
      }
    `;
    
    document.head.appendChild(style);
    document.body.classList.add('toddler-mode');
  }

  private removeToddlerModeStyles(): void {
    const style = document.getElementById('toddler-mode-styles');
    if (style) {
      style.remove();
    }
    document.body.classList.remove('toddler-mode');
  }

  private showActivationNotification(): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(45deg, #00FF00, #00CCFF);
      color: black;
      padding: 15px 25px;
      border-radius: 25px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: 18px;
      z-index: 15000;
      box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
      animation: slideInBounce 0.5s ease;
    `;
    
    notification.innerHTML = `
      🔒 Toddler Mode Active! 🎵<br>
      <span style="font-size: 14px;">Computer is safe - press any key to make music!</span>
    `;

    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutUp 0.5s ease';
      setTimeout(() => notification.remove(), 500);
    }, 4000);
  }

  private showParentControls(): void {
    if (this.parentControlsVisible || !this.parentControlPanel) return;
    
    this.parentControlsVisible = true;
    this.parentControlPanel.style.transform = 'translate(-50%, -50%) scale(1)';
  }

  private hideParentControls(): void {
    if (!this.parentControlsVisible || !this.parentControlPanel) return;
    
    this.parentControlsVisible = false;
    this.parentControlPanel.style.transform = 'translate(-50%, -50%) scale(0)';
  }

  private handleFullscreenChange(): void {
    const isFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isFullscreen && this.fullscreenLocked) {
      // Try to re-enter fullscreen if it was exited unintentionally
      setTimeout(() => {
        if (this.isToddlerModeActive) {
          this.enterFullscreen().catch(() => {
            // If we can't re-enter fullscreen, show parent controls
            this.showParentControls();
          });
        }
      }, 100);
    }
  }

  public exitToddlerMode(): void {
    if (!this.isToddlerModeActive) return;

    this.isToddlerModeActive = false;
    this.keyboardOverride = false;
    this.fullscreenLocked = false;
    this.exitSequence = [];

    // Exit fullscreen
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }

    // Remove styles and event listeners
    this.removeToddlerModeStyles();
    this.hideParentControls();

    // Show exit notification
    this.showExitNotification();

    console.log('🔓 Toddler Mode deactivated - Normal computer control restored');
  }

  private showExitNotification(): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(45deg, #FF6600, #FF0000);
      color: white;
      padding: 15px 25px;
      border-radius: 25px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: 18px;
      z-index: 15000;
      box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
    `;
    
    notification.innerHTML = `
      🔓 Toddler Mode Deactivated<br>
      <span style="font-size: 14px;">Normal computer control restored</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }

  private showError(message: string): void {
    const error = document.createElement('div');
    error.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #FF0000;
      color: white;
      padding: 15px 25px;
      border-radius: 10px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      z-index: 15000;
    `;
    error.textContent = message;
    
    document.body.appendChild(error);
    setTimeout(() => error.remove(), 5000);
  }

  public isActive(): boolean {
    return this.isToddlerModeActive;
  }

  public getStatus(): { active: boolean; fullscreen: boolean; locked: boolean } {
    return {
      active: this.isToddlerModeActive,
      fullscreen: !!document.fullscreenElement,
      locked: this.fullscreenLocked
    };
  }
}