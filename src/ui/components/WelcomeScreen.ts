export class WelcomeScreen {
  private container: HTMLElement;
  private isShown = false;

  constructor() {
    this.container = this.createContainer();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'welcome-screen';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, rgba(10,10,10,0.95), rgba(20,0,20,0.95));
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Courier New', monospace;
      color: white;
      backdrop-filter: blur(10px);
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      text-align: center;
      max-width: 600px;
      padding: 40px;
      background: rgba(0,0,0,0.8);
      border: 2px solid #FF00FF;
      border-radius: 20px;
      box-shadow: 0 0 40px rgba(255,0,255,0.3);
    `;

    content.innerHTML = `
      <h1 style="color: #FF00FF; font-size: 48px; margin: 0 0 20px 0; text-shadow: 0 0 20px #FF00FF;">
        🎹 Keyboard Cosmic Jam 🚀
      </h1>
      
      <p style="font-size: 18px; color: #00FFFF; margin: 20px 0; text-shadow: 0 0 10px #00FFFF;">
        Transform your keyboard into a magical 80s synthesizer!
      </p>
      
      <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: left; font-size: 14px;">
        <h3 style="color: #FFFF00; margin: 0 0 15px 0; text-align: center;">🎵 Quick Start Guide</h3>
        
        <div style="margin: 12px 0; display: flex; align-items: center; gap: 12px;">
          <span style="background: #FF00FF; padding: 4px 8px; border-radius: 4px; min-width: 80px; text-align: center; font-weight: bold;">Numbers</span>
          <span>🥁 Digital drums (kick, snare, hi-hat)</span>
        </div>
        
        <div style="margin: 12px 0; display: flex; align-items: center; gap: 12px;">
          <span style="background: #00FFFF; padding: 4px 8px; border-radius: 4px; min-width: 80px; text-align: center; font-weight: bold;">QWERTY</span>
          <span>⚡ High-energy synth leads</span>
        </div>
        
        <div style="margin: 12px 0; display: flex; align-items: center; gap: 12px;">
          <span style="background: #FFFF00; color: black; padding: 4px 8px; border-radius: 4px; min-width: 80px; text-align: center; font-weight: bold;">ASDF</span>
          <span>🎹 Smooth melody pads</span>
        </div>
        
        <div style="margin: 12px 0; display: flex; align-items: center; gap: 12px;">
          <span style="background: #FF8000; padding: 4px 8px; border-radius: 4px; min-width: 80px; text-align: center; font-weight: bold;">ZXCV</span>
          <span>🎸 Deep bass sounds</span>
        </div>
        
        <div style="margin: 12px 0; display: flex; align-items: center; gap: 12px;">
          <span style="background: #80FF00; color: black; padding: 4px 8px; border-radius: 4px; min-width: 80px; text-align: center; font-weight: bold;">SPACE</span>
          <span>🔔 Magic cosmic bells</span>
        </div>
      </div>
      
      <div style="background: rgba(0,50,50,0.3); padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 13px;">
        <h4 style="color: #00FFFF; margin: 0 0 10px 0;">⌨️ Keyboard Shortcuts</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: left;">
          <div><strong>K</strong> - Show keyboard guide</div>
          <div><strong>Ctrl+R</strong> - Recording studio</div>
        </div>
      </div>
      
      <div style="margin: 30px 0 20px 0;">
        <button id="start-playing" style="
          background: linear-gradient(45deg, #FF00FF, #00FFFF);
          border: none;
          color: white;
          padding: 15px 30px;
          font-size: 18px;
          border-radius: 25px;
          cursor: pointer;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          text-shadow: 0 0 8px rgba(0,0,0,0.8);
          box-shadow: 0 0 20px rgba(255,0,255,0.4);
          transition: all 0.3s ease;
          margin: 10px;
        ">
          🚀 Start Creating Music! 🎵
        </button>
        
        <button id="toddler-mode" style="
          background: linear-gradient(45deg, #00FF00, #FFFF00);
          border: none;
          color: black;
          padding: 15px 30px;
          font-size: 18px;
          border-radius: 25px;
          cursor: pointer;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          text-shadow: 0 0 8px rgba(255,255,255,0.8);
          box-shadow: 0 0 20px rgba(0,255,0,0.4);
          transition: all 0.3s ease;
          margin: 10px;
        ">
          🔒 Safe Toddler Mode 👶
        </button>
      </div>
      
      <div style="background: rgba(0,100,0,0.2); padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 13px; border: 1px solid #00FF00;">
        <h4 style="color: #00FF00; margin: 0 0 10px 0;">🔒 Toddler Mode Features:</h4>
        <div style="text-align: left; line-height: 1.4;">
          • <strong>Fullscreen lock</strong> - Cannot exit accidentally<br>
          • <strong>All keys make music</strong> - Every button is safe<br>
          • <strong>System shortcuts disabled</strong> - No file access<br>
          • <strong>Parent controls</strong> - Type "parent" to exit
        </div>
      </div>
      
      <p style="font-size: 12px; color: #888; margin: 20px 0 0 0;">
        Perfect for kids ages 3-6 • Made with ❤️ and lots of neon
      </p>
    `;

    container.appendChild(content);
    document.body.appendChild(container);

    // Setup button clicks
    const startButton = content.querySelector('#start-playing') as HTMLButtonElement;
    const toddlerButton = content.querySelector('#toddler-mode') as HTMLButtonElement;
    
    startButton.addEventListener('click', () => {
      this.hide();
      
      // Emit custom event to signal game start
      document.dispatchEvent(new CustomEvent('gameStartRequested'));
      
      // Optional: Show a brief tutorial overlay
      console.log('🎮 Game started! Try pressing keys to make music!');
    });

    toddlerButton.addEventListener('click', () => {
      this.hide();
      
      // Emit custom event to signal toddler mode start
      document.dispatchEvent(new CustomEvent('toddlerModeRequested'));
      
      console.log('👶 Toddler Mode requested! Activating safe mode...');
    });

    // Button hover effects
    [startButton, toddlerButton].forEach((button, index) => {
      const colors = [
        { normal: '0 0 20px rgba(255,0,255,0.4)', hover: '0 0 30px rgba(255,0,255,0.6)' },
        { normal: '0 0 20px rgba(0,255,0,0.4)', hover: '0 0 30px rgba(0,255,0,0.6)' }
      ];
      
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
        button.style.boxShadow = colors[index].hover;
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = colors[index].normal;
      });
    });

    return container;
  }

  public show(): void {
    if (this.isShown) return;
    
    this.isShown = true;
    this.container.style.display = 'flex';
    
    // Animate in
    this.container.style.opacity = '0';
    requestAnimationFrame(() => {
      this.container.style.transition = 'opacity 0.5s ease';
      this.container.style.opacity = '1';
    });
  }

  public hide(): void {
    if (!this.isShown) return;
    
    this.container.style.transition = 'opacity 0.3s ease';
    this.container.style.opacity = '0';
    
    setTimeout(() => {
      this.container.style.display = 'none';
      this.isShown = false;
    }, 300);
  }

  public cleanup(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  // Check if this is the first visit
  public static shouldShow(): boolean {
    // In development, always show the welcome screen
    if (import.meta.env.DEV) {
      return true;
    }
    
    const hasVisited = localStorage.getItem('keyboardCosmicJam_hasVisited');
    if (!hasVisited) {
      localStorage.setItem('keyboardCosmicJam_hasVisited', 'true');
      return true;
    }
    return false;
  }
}