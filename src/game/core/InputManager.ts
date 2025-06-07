import { EventEmitter } from '@utils/EventEmitter';
import { getKeyMapping } from '@game/data/KeyMappings';

export interface TouchZone {
  id: string;
  keys: string[];
  bounds: { x: number; y: number; width: number; height: number };
  instrument?: string;
  color?: string;
  label?: string;
}

export class InputManager extends EventEmitter {
  private keyMap: Map<string, boolean> = new Map();
  private touchZones: TouchZone[] = [];
  private activeTouch: Map<number, TouchZone> = new Map();
  
  constructor() {
    super();
  }

  public initialize(): void {
    this.setupKeyboardListeners();
    this.setupTouchListeners();
    this.generateTouchZones();
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private setupTouchListeners(): void {
    const app = document.getElementById('app');
    if (!app) return;

    app.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    app.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    app.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    app.addEventListener('mousedown', this.handleMouseDown.bind(this));
    app.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  private generateTouchZones(): void {
    // Generate touch zones based on screen size
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    if (isLandscape) {
      // Keyboard-like layout
      this.createKeyboardLayout(width, height);
    } else {
      // Grid layout for portrait
      this.createGridLayout(4, 4, width, height);
    }
  }

  private createKeyboardLayout(width: number, height: number): void {
    this.touchZones = [];
    
    // Create keyboard-like zones for landscape mode
    const keyWidth = width / 10;
    const keyHeight = height / 5;
    const margin = 8;

    // Number row (drums) - top row
    const drumKeys = ['1', '2', '3', '4', '5'];
    drumKeys.forEach((key, index) => {
      const mapping = getKeyMapping(key);
      if (mapping) {
        this.touchZones.push({
          id: `drum_${key}`,
          keys: [key],
          bounds: {
            x: index * keyWidth + margin,
            y: margin,
            width: keyWidth - margin * 2,
            height: keyHeight - margin
          },
          instrument: mapping.instrument,
          color: mapping.color,
          label: mapping.displayName
        });
      }
    });

    // Top row (synth lead) - QWERTY
    const topKeys = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i'];
    topKeys.forEach((key, index) => {
      const mapping = getKeyMapping(key);
      if (mapping) {
        this.touchZones.push({
          id: `lead_${key}`,
          keys: [key],
          bounds: {
            x: index * keyWidth + margin + keyWidth * 0.25,
            y: keyHeight + margin,
            width: keyWidth - margin * 2,
            height: keyHeight - margin
          },
          instrument: mapping.instrument,
          color: mapping.color,
          label: mapping.displayName
        });
      }
    });

    // Home row (synth pad) - ASDF
    const homeKeys = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];
    homeKeys.forEach((key, index) => {
      const mapping = getKeyMapping(key);
      if (mapping) {
        this.touchZones.push({
          id: `pad_${key}`,
          keys: [key],
          bounds: {
            x: index * keyWidth + margin + keyWidth * 0.5,
            y: keyHeight * 2 + margin,
            width: keyWidth - margin * 2,
            height: keyHeight - margin
          },
          instrument: mapping.instrument,
          color: mapping.color,
          label: mapping.displayName
        });
      }
    });

    // Bottom row (bass) - ZXCV
    const bottomKeys = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];
    bottomKeys.forEach((key, index) => {
      const mapping = getKeyMapping(key);
      if (mapping) {
        this.touchZones.push({
          id: `bass_${key}`,
          keys: [key],
          bounds: {
            x: index * keyWidth + margin + keyWidth * 0.75,
            y: keyHeight * 3 + margin,
            width: keyWidth - margin * 2,
            height: keyHeight - margin
          },
          instrument: mapping.instrument,
          color: mapping.color,
          label: mapping.displayName
        });
      }
    });

    // Space bar - special wide button
    const spaceMapping = getKeyMapping(' ');
    if (spaceMapping) {
      this.touchZones.push({
        id: 'space',
        keys: [' '],
        bounds: {
          x: width * 0.3,
          y: keyHeight * 4 + margin,
          width: width * 0.4,
          height: keyHeight - margin
        },
        instrument: spaceMapping.instrument,
        color: spaceMapping.color,
        label: spaceMapping.displayName
      });
    }
  }

  private createGridLayout(cols: number, rows: number, width: number, height: number): void {
    this.touchZones = [];
    
    // Create a grid layout for portrait mode
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    const margin = 4;

    // Select the most important keys for a compact grid
    const gridKeys = [
      // Top row - drums
      ['1', '2', '3', '4'],
      // Second row - main melody (home row)
      ['a', 's', 'd', 'f'],
      // Third row - bass
      ['z', 'x', 'c', 'v'],
      // Bottom row - special effects
      ['q', 'w', ' ', 'enter']
    ];

    gridKeys.forEach((row, rowIndex) => {
      row.forEach((key, colIndex) => {
        const mapping = getKeyMapping(key);
        if (mapping) {
          // Special handling for space and enter keys
          let bounds = {
            x: colIndex * cellWidth + margin,
            y: rowIndex * cellHeight + margin,
            width: cellWidth - margin * 2,
            height: cellHeight - margin * 2
          };

          // Make space bar wider
          if (key === ' ') {
            bounds.width = cellWidth * 1.5 - margin * 2;
          }

          this.touchZones.push({
            id: `grid_${key}_${rowIndex}_${colIndex}`,
            keys: [key],
            bounds,
            instrument: mapping.instrument,
            color: mapping.color,
            label: this.getShortLabel(mapping.displayName)
          });
        }
      });
    });

    // Add some extra zones for frequently used keys in remaining space
    if (height > rows * cellHeight) {
      // Add a few more popular keys at the bottom
      const extraKeys = ['g', 'h', 'y', 'u'];
      const extraCellWidth = width / extraKeys.length;
      
      extraKeys.forEach((key, index) => {
        const mapping = getKeyMapping(key);
        if (mapping) {
          this.touchZones.push({
            id: `extra_${key}`,
            keys: [key],
            bounds: {
              x: index * extraCellWidth + margin,
              y: rows * cellHeight + margin,
              width: extraCellWidth - margin * 2,
              height: (height - rows * cellHeight) - margin * 2
            },
            instrument: mapping.instrument,
            color: mapping.color,
            label: this.getShortLabel(mapping.displayName)
          });
        }
      });
    }
  }

  private getShortLabel(displayName: string): string {
    // Create shorter labels for mobile
    const shortNames: Record<string, string> = {
      '1 - Kick': 'Kick',
      '2 - Snare': 'Snare',
      '3 - Hi-Hat': 'HiHat',
      '4 - Crash': 'Crash',
      '5 - Clap': 'Clap',
      'Space - Magic Bell': 'Bell',
      'Enter - Power!': 'Power'
    };
    
    return shortNames[displayName] || displayName.split(' - ')[1] || displayName.charAt(0).toUpperCase();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.repeat) return;
    
    const key = event.key.toLowerCase();
    if (!this.keyMap.get(key)) {
      this.keyMap.set(key, true);
      this.emit('keyPress', key);
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.keyMap.set(key, false);
    this.emit('keyRelease', key);
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    
    Array.from(event.changedTouches).forEach(touch => {
      const point = { x: touch.clientX, y: touch.clientY };
      const zone = this.getTouchZone(point);
      
      if (zone) {
        this.activeTouch.set(touch.identifier, zone);
        this.emit('touchPress', point);
      }
    });
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    // TODO: Handle touch move for sliding between zones
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    Array.from(event.changedTouches).forEach(touch => {
      const zone = this.activeTouch.get(touch.identifier);
      if (zone) {
        this.activeTouch.delete(touch.identifier);
        this.emit('touchRelease', { x: touch.clientX, y: touch.clientY });
      }
    });
  }

  private handleMouseDown(event: MouseEvent): void {
    const point = { x: event.clientX, y: event.clientY };
    this.emit('touchPress', point);
  }

  private handleMouseUp(event: MouseEvent): void {
    const point = { x: event.clientX, y: event.clientY };
    this.emit('touchRelease', point);
  }

  public getTouchZone(point: { x: number; y: number }): TouchZone | null {
    return this.touchZones.find(zone => 
      point.x >= zone.bounds.x &&
      point.x <= zone.bounds.x + zone.bounds.width &&
      point.y >= zone.bounds.y &&
      point.y <= zone.bounds.y + zone.bounds.height
    ) || null;
  }

  public getTouchZones(): TouchZone[] {
    return this.touchZones;
  }

  public cleanup(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    
    const app = document.getElementById('app');
    if (app) {
      app.removeEventListener('touchstart', this.handleTouchStart.bind(this));
      app.removeEventListener('touchmove', this.handleTouchMove.bind(this));
      app.removeEventListener('touchend', this.handleTouchEnd.bind(this));
      app.removeEventListener('mousedown', this.handleMouseDown.bind(this));
      app.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    }
    
    this.keyMap.clear();
    this.activeTouch.clear();
  }
}