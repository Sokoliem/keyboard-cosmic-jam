import { KEYBOARD_MAPPINGS, KeyMapping } from '@game/data/KeyMappings';

export class KeyboardOverlay {
  private container: HTMLElement;
  private isVisible = false;
  private keyElements: Map<string, HTMLElement> = new Map();

  constructor() {
    this.container = this.createContainer();
    this.createKeyboard();
    this.setupEventListeners();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'keyboard-overlay';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(10, 10, 10, 0.95);
      border: 2px solid #00FFFF;
      border-radius: 16px;
      padding: 20px;
      font-family: 'Courier New', monospace;
      color: #FFFFFF;
      font-size: 12px;
      box-shadow: 0 0 30px rgba(0, 255, 255, 0.4);
      backdrop-filter: blur(15px);
      z-index: 999;
      display: none;
      user-select: none;
      max-width: 90vw;
      overflow: hidden;
    `;
    document.body.appendChild(container);
    return container;
  }

  private createKeyboard(): void {
    // Create title
    const title = document.createElement('div');
    title.textContent = '⌨️ Keyboard Mapping Guide';
    title.style.cssText = `
      text-align: center;
      color: #00FFFF;
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 16px;
      text-shadow: 0 0 8px #00FFFF;
    `;
    this.container.appendChild(title);

    // Create hint
    const hint = document.createElement('div');
    hint.textContent = 'Press K to toggle this guide • Press keys to highlight them';
    hint.style.cssText = `
      text-align: center;
      color: #888;
      font-size: 10px;
      margin-bottom: 16px;
    `;
    this.container.appendChild(hint);

    // Create keyboard layout
    this.createKeyRows();

    // Create legend
    this.createLegend();
  }

  private createKeyRows(): void {
    const keyboardLayout = [
      {
        label: 'Numbers (Drums)',
        keys: ['1', '2', '3', '4', '5'],
        className: 'number-row'
      },
      {
        label: 'Top Row (Synth Lead)',
        keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i'],
        className: 'top-row'
      },
      {
        label: 'Home Row (Synth Pad)',
        keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'],
        className: 'home-row'
      },
      {
        label: 'Bottom Row (Bass)',
        keys: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
        className: 'bottom-row'
      },
      {
        label: 'Special Keys',
        keys: [' ', 'enter'],
        className: 'special-row'
      }
    ];

    keyboardLayout.forEach(row => {
      const rowContainer = document.createElement('div');
      rowContainer.style.cssText = `
        margin-bottom: 12px;
      `;

      const rowLabel = document.createElement('div');
      rowLabel.textContent = row.label;
      rowLabel.style.cssText = `
        font-size: 11px;
        color: #AAA;
        margin-bottom: 6px;
        text-align: center;
      `;
      rowContainer.appendChild(rowLabel);

      const keysContainer = document.createElement('div');
      keysContainer.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 4px;
        flex-wrap: wrap;
      `;

      row.keys.forEach(key => {
        const keyElement = this.createKeyElement(key);
        keysContainer.appendChild(keyElement);
        this.keyElements.set(key, keyElement);
      });

      rowContainer.appendChild(keysContainer);
      this.container.appendChild(rowContainer);
    });
  }

  private createKeyElement(key: string): HTMLElement {
    const mapping = KEYBOARD_MAPPINGS.find(m => m.key === key);
    
    const keyElement = document.createElement('div');
    keyElement.className = `key-${key.replace(' ', 'space')}`;
    
    const displayKey = key === ' ' ? 'SPACE' : key === 'enter' ? 'ENTER' : key.toUpperCase();
    const color = mapping?.color || '#666666';
    const instrumentIcon = this.getInstrumentIcon(mapping?.instrument || '');
    
    keyElement.style.cssText = `
      background: linear-gradient(135deg, ${color}22, ${color}44);
      border: 2px solid ${color};
      color: #FFFFFF;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
      min-width: 40px;
      position: relative;
      font-weight: bold;
      text-shadow: 0 0 4px rgba(0,0,0,0.8);
      box-shadow: 0 0 8px ${color}33;
    `;

    // Key label
    const keyLabel = document.createElement('div');
    keyLabel.textContent = displayKey;
    keyLabel.style.cssText = `
      font-size: 14px;
      margin-bottom: 2px;
    `;

    // Instrument icon
    const iconElement = document.createElement('div');
    iconElement.textContent = instrumentIcon;
    iconElement.style.cssText = `
      font-size: 16px;
      margin-bottom: 2px;
    `;

    // Instrument name
    const instrumentName = document.createElement('div');
    instrumentName.textContent = this.getShortInstrumentName(mapping?.instrument || '');
    instrumentName.style.cssText = `
      font-size: 8px;
      color: #CCC;
    `;

    keyElement.appendChild(iconElement);
    keyElement.appendChild(keyLabel);
    keyElement.appendChild(instrumentName);

    // Hover effects
    keyElement.addEventListener('mouseenter', () => {
      keyElement.style.transform = 'scale(1.1)';
      keyElement.style.boxShadow = `0 0 16px ${color}66`;
    });

    keyElement.addEventListener('mouseleave', () => {
      keyElement.style.transform = 'scale(1)';
      keyElement.style.boxShadow = `0 0 8px ${color}33`;
    });

    // Click to show details
    keyElement.addEventListener('click', () => {
      this.showKeyDetails(mapping);
    });

    return keyElement;
  }

  private getInstrumentIcon(instrument: string): string {
    const icons: Record<string, string> = {
      'synthBass': '🎸',
      'synthLead': '⚡',
      'synthPad': '🎹',
      'fmBell': '🔔',
      'digitalDrum': '🥁',
      'arpeggiate': '🌟'
    };
    return icons[instrument] || '🎵';
  }

  private getShortInstrumentName(instrument: string): string {
    const names: Record<string, string> = {
      'synthBass': 'Bass',
      'synthLead': 'Lead',
      'synthPad': 'Pad',
      'fmBell': 'Bell',
      'digitalDrum': 'Drum',
      'arpeggiate': 'Arp'
    };
    return names[instrument] || 'Sound';
  }

  private createLegend(): void {
    const legend = document.createElement('div');
    legend.style.cssText = `
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #444;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
      font-size: 10px;
    `;

    const instruments = [
      { name: 'Bass', icon: '🎸', color: '#FF00FF', desc: 'Deep low sounds' },
      { name: 'Lead', icon: '⚡', color: '#00FFFF', desc: 'Sharp high sounds' },
      { name: 'Pad', icon: '🎹', color: '#FFFF00', desc: 'Smooth melodies' },
      { name: 'Bell', icon: '🔔', color: '#80FF00', desc: 'Crystal tones' },
      { name: 'Drums', icon: '🥁', color: '#FF8000', desc: 'Rhythm beats' },
      { name: 'Arp', icon: '🌟', color: '#FF0080', desc: 'Cascading notes' }
    ];

    instruments.forEach(inst => {
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px;
        background: rgba(0,0,0,0.3);
        border-radius: 4px;
        border-left: 3px solid ${inst.color};
      `;

      item.innerHTML = `
        <span style="font-size: 12px;">${inst.icon}</span>
        <div>
          <div style="font-weight: bold; color: ${inst.color};">${inst.name}</div>
          <div style="color: #AAA; font-size: 9px;">${inst.desc}</div>
        </div>
      `;

      legend.appendChild(item);
    });

    this.container.appendChild(legend);
  }

  private showKeyDetails(mapping: KeyMapping | undefined): void {
    if (!mapping) return;

    // Create a temporary tooltip
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid ${mapping.color};
      border-radius: 12px;
      padding: 20px;
      color: white;
      font-family: 'Courier New', monospace;
      text-align: center;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 0 30px ${mapping.color}66;
    `;

    tooltip.innerHTML = `
      <h3 style="color: ${mapping.color}; margin: 0 0 10px 0; text-shadow: 0 0 8px ${mapping.color};">${mapping.displayName}</h3>
      <p style="margin: 8px 0; color: #CCC;">Instrument: ${mapping.instrument}</p>
      <p style="margin: 8px 0; color: #CCC;">Note: ${mapping.note}${mapping.octave}</p>
      <p style="margin: 8px 0; font-size: 12px; color: #AAA;">Press ${mapping.key.toUpperCase()} to play this sound</p>
      <button style="margin-top: 12px; padding: 8px 16px; background: ${mapping.color}; border: none; border-radius: 6px; color: white; cursor: pointer; font-family: inherit;">Close</button>
    `;

    document.body.appendChild(tooltip);

    const closeBtn = tooltip.querySelector('button');
    const closeTooltip = () => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    };

    closeBtn?.addEventListener('click', closeTooltip);
    
    // Auto-close after 5 seconds
    setTimeout(closeTooltip, 5000);
  }

  private setupEventListeners(): void {
    // Listen for key presses to highlight keys
    document.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      this.highlightKey(key, true);
    });

    document.addEventListener('keyup', (event) => {
      const key = event.key.toLowerCase();
      this.highlightKey(key, false);
    });
  }

  public highlightKey(key: string, isPressed: boolean): void {
    const keyElement = this.keyElements.get(key);
    if (!keyElement) return;

    if (isPressed) {
      keyElement.style.transform = 'scale(1.2)';
      keyElement.style.filter = 'brightness(1.5)';
      keyElement.style.zIndex = '1001';
    } else {
      keyElement.style.transform = 'scale(1)';
      keyElement.style.filter = 'brightness(1)';
      keyElement.style.zIndex = 'auto';
    }
  }

  public show(): void {
    this.isVisible = true;
    this.container.style.display = 'block';
    
    // Animate in
    this.container.style.opacity = '0';
    this.container.style.transform = 'translateX(-50%) translateY(20px)';
    
    requestAnimationFrame(() => {
      this.container.style.transition = 'all 0.3s ease';
      this.container.style.opacity = '1';
      this.container.style.transform = 'translateX(-50%) translateY(0)';
    });
  }

  public hide(): void {
    this.isVisible = false;
    
    this.container.style.transition = 'all 0.3s ease';
    this.container.style.opacity = '0';
    this.container.style.transform = 'translateX(-50%) translateY(20px)';
    
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

  public isShowing(): boolean {
    return this.isVisible;
  }

  public cleanup(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}