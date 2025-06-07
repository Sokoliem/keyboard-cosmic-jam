export interface KeyMapping {
  key: string;
  note: string;
  octave: number;
  instrument: string;
  color: string;
  displayName: string;
}

export interface InstrumentConfig {
  name: string;
  type: 'synth' | 'fm' | 'am' | 'noise';
  waveform?: OscillatorType;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  modulation?: {
    frequency: number;
    depth: number;
  };
}

// Musical note frequencies (A4 = 440Hz)
export const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 261.63,  'C#': 277.18,  'D': 293.66,  'D#': 311.13,
  'E': 329.63,  'F': 349.23,  'F#': 369.99, 'G': 392.00,
  'G#': 415.30, 'A': 440.00,  'A#': 466.16, 'B': 493.88
};

// 80s neon color palette
export const NEON_COLORS = {
  MAGENTA: '#FF00FF',
  CYAN: '#00FFFF',
  YELLOW: '#FFFF00',
  GREEN: '#00FF00',
  ORANGE: '#FF8000',
  PURPLE: '#8000FF',
  PINK: '#FF0080',
  LIME: '#80FF00'
};

// Retro instruments inspired by 80s synthesizers
export const INSTRUMENTS: Record<string, InstrumentConfig> = {
  synthBass: {
    name: 'Synth Bass',
    type: 'synth',
    waveform: 'sawtooth',
    attack: 0.01,
    decay: 0.3,
    sustain: 0.4,
    release: 0.8
  },
  synthLead: {
    name: 'Synth Lead',
    type: 'synth',
    waveform: 'square',
    attack: 0.02,
    decay: 0.1,
    sustain: 0.6,
    release: 0.4
  },
  synthPad: {
    name: 'Synth Pad',
    type: 'synth',
    waveform: 'sine',
    attack: 0.5,
    decay: 0.2,
    sustain: 0.8,
    release: 1.5
  },
  fmBell: {
    name: 'FM Bell',
    type: 'fm',
    attack: 0.01,
    decay: 0.8,
    sustain: 0.0,
    release: 1.2,
    modulation: { frequency: 2.5, depth: 0.8 }
  },
  digitalDrum: {
    name: 'Digital Drums',
    type: 'noise',
    attack: 0.001,
    decay: 0.1,
    sustain: 0.0,
    release: 0.2
  },
  arpeggiate: {
    name: 'Arpeggiator',
    type: 'synth',
    waveform: 'triangle',
    attack: 0.01,
    decay: 0.05,
    sustain: 0.2,
    release: 0.3
  }
};

// Complete keyboard layout mapped to musical notes
// Every key makes a sound for maximum toddler engagement
export const KEYBOARD_MAPPINGS: KeyMapping[] = [
  // Number row - Drum sounds and special effects
  { key: '`', note: 'kick', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.MAGENTA, displayName: '` - Deep Kick' },
  { key: '1', note: 'kick', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.MAGENTA, displayName: '1 - Kick' },
  { key: '2', note: 'snare', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.CYAN, displayName: '2 - Snare' },
  { key: '3', note: 'hihat', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.YELLOW, displayName: '3 - Hi-Hat' },
  { key: '4', note: 'crash', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.GREEN, displayName: '4 - Crash' },
  { key: '5', note: 'clap', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.ORANGE, displayName: '5 - Clap' },
  { key: '6', note: 'tom1', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.PURPLE, displayName: '6 - Tom 1' },
  { key: '7', note: 'tom2', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.PINK, displayName: '7 - Tom 2' },
  { key: '8', note: 'tom3', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.LIME, displayName: '8 - Tom 3' },
  { key: '9', note: 'cymbal', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.MAGENTA, displayName: '9 - Cymbal' },
  { key: '0', note: 'cowbell', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.CYAN, displayName: '0 - Cowbell' },
  { key: '-', note: 'openhat', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.YELLOW, displayName: '- - Open Hat' },
  { key: '=', note: 'ride', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.GREEN, displayName: '= - Ride' },

  // Top row - High energy sounds (Synth Lead)
  { key: 'q', note: 'C', octave: 5, instrument: 'synthLead', color: NEON_COLORS.MAGENTA, displayName: 'Q - High C' },
  { key: 'w', note: 'D', octave: 5, instrument: 'synthLead', color: NEON_COLORS.CYAN, displayName: 'W - High D' },
  { key: 'e', note: 'E', octave: 5, instrument: 'synthLead', color: NEON_COLORS.YELLOW, displayName: 'E - High E' },
  { key: 'r', note: 'F', octave: 5, instrument: 'synthLead', color: NEON_COLORS.GREEN, displayName: 'R - High F' },
  { key: 't', note: 'G', octave: 5, instrument: 'synthLead', color: NEON_COLORS.ORANGE, displayName: 'T - High G' },
  { key: 'y', note: 'A', octave: 5, instrument: 'synthLead', color: NEON_COLORS.PURPLE, displayName: 'Y - High A' },
  { key: 'u', note: 'B', octave: 5, instrument: 'synthLead', color: NEON_COLORS.PINK, displayName: 'U - High B' },
  { key: 'i', note: 'C', octave: 6, instrument: 'fmBell', color: NEON_COLORS.LIME, displayName: 'I - Bell C' },
  { key: 'o', note: 'D', octave: 6, instrument: 'fmBell', color: NEON_COLORS.MAGENTA, displayName: 'O - Bell D' },
  { key: 'p', note: 'E', octave: 6, instrument: 'fmBell', color: NEON_COLORS.CYAN, displayName: 'P - Bell E' },
  { key: '[', note: 'F', octave: 6, instrument: 'fmBell', color: NEON_COLORS.YELLOW, displayName: '[ - Bell F' },
  { key: ']', note: 'G', octave: 6, instrument: 'fmBell', color: NEON_COLORS.GREEN, displayName: '] - Bell G' },
  { key: '\\', note: 'A', octave: 6, instrument: 'fmBell', color: NEON_COLORS.ORANGE, displayName: '\\ - Bell A' },

  // Home row - Main melody (Synth Pad)
  { key: 'a', note: 'C', octave: 4, instrument: 'synthPad', color: NEON_COLORS.MAGENTA, displayName: 'A - Middle C' },
  { key: 's', note: 'D', octave: 4, instrument: 'synthPad', color: NEON_COLORS.CYAN, displayName: 'S - Middle D' },
  { key: 'd', note: 'E', octave: 4, instrument: 'synthPad', color: NEON_COLORS.YELLOW, displayName: 'D - Middle E' },
  { key: 'f', note: 'F', octave: 4, instrument: 'synthPad', color: NEON_COLORS.GREEN, displayName: 'F - Middle F' },
  { key: 'g', note: 'G', octave: 4, instrument: 'synthPad', color: NEON_COLORS.ORANGE, displayName: 'G - Middle G' },
  { key: 'h', note: 'A', octave: 4, instrument: 'synthPad', color: NEON_COLORS.PURPLE, displayName: 'H - Middle A' },
  { key: 'j', note: 'B', octave: 4, instrument: 'synthPad', color: NEON_COLORS.PINK, displayName: 'J - Middle B' },
  { key: 'k', note: 'C', octave: 5, instrument: 'arpeggiate', color: NEON_COLORS.LIME, displayName: 'K - Arp C' },
  { key: 'l', note: 'D', octave: 5, instrument: 'arpeggiate', color: NEON_COLORS.MAGENTA, displayName: 'L - Arp D' },
  { key: ';', note: 'E', octave: 5, instrument: 'arpeggiate', color: NEON_COLORS.CYAN, displayName: '; - Arp E' },
  { key: "'", note: 'F', octave: 5, instrument: 'arpeggiate', color: NEON_COLORS.YELLOW, displayName: "' - Arp F" },

  // Bottom row - Bass sounds (Synth Bass)
  { key: 'z', note: 'C', octave: 3, instrument: 'synthBass', color: NEON_COLORS.MAGENTA, displayName: 'Z - Low C' },
  { key: 'x', note: 'D', octave: 3, instrument: 'synthBass', color: NEON_COLORS.CYAN, displayName: 'X - Low D' },
  { key: 'c', note: 'E', octave: 3, instrument: 'synthBass', color: NEON_COLORS.YELLOW, displayName: 'C - Low E' },
  { key: 'v', note: 'F', octave: 3, instrument: 'synthBass', color: NEON_COLORS.GREEN, displayName: 'V - Low F' },
  { key: 'b', note: 'G', octave: 3, instrument: 'synthBass', color: NEON_COLORS.ORANGE, displayName: 'B - Low G' },
  { key: 'n', note: 'A', octave: 3, instrument: 'synthBass', color: NEON_COLORS.PURPLE, displayName: 'N - Low A' },
  { key: 'm', note: 'B', octave: 3, instrument: 'synthBass', color: NEON_COLORS.PINK, displayName: 'M - Low B' },
  { key: ',', note: 'C', octave: 2, instrument: 'synthBass', color: NEON_COLORS.LIME, displayName: ', - Deep C' },
  { key: '.', note: 'D', octave: 2, instrument: 'synthBass', color: NEON_COLORS.MAGENTA, displayName: '. - Deep D' },
  { key: '/', note: 'E', octave: 2, instrument: 'synthBass', color: NEON_COLORS.CYAN, displayName: '/ - Deep E' },

  // Special keys - Fun magical sounds
  { key: ' ', note: 'C', octave: 4, instrument: 'fmBell', color: NEON_COLORS.LIME, displayName: 'Space - Magic Bell' },
  { key: 'enter', note: 'powerchord', octave: 3, instrument: 'synthLead', color: NEON_COLORS.PINK, displayName: 'Enter - Power!' },
  { key: 'tab', note: 'whoosh', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.PURPLE, displayName: 'Tab - Whoosh' },
  { key: 'capslock', note: 'laser', octave: 0, instrument: 'fmBell', color: NEON_COLORS.ORANGE, displayName: 'Caps - Laser' },
  { key: 'shift', note: 'sparkle', octave: 0, instrument: 'arpeggiate', color: NEON_COLORS.YELLOW, displayName: 'Shift - Sparkle' },
  { key: 'control', note: 'echo', octave: 0, instrument: 'synthPad', color: NEON_COLORS.GREEN, displayName: 'Ctrl - Echo' },
  { key: 'alt', note: 'bounce', octave: 0, instrument: 'synthLead', color: NEON_COLORS.CYAN, displayName: 'Alt - Bounce' },
  { key: 'meta', note: 'rainbow', octave: 0, instrument: 'fmBell', color: NEON_COLORS.MAGENTA, displayName: 'Win - Rainbow' },

  // Arrow keys - Movement sounds
  { key: 'arrowup', note: 'up', octave: 0, instrument: 'arpeggiate', color: NEON_COLORS.LIME, displayName: '↑ - Up' },
  { key: 'arrowdown', note: 'down', octave: 0, instrument: 'synthBass', color: NEON_COLORS.ORANGE, displayName: '↓ - Down' },
  { key: 'arrowleft', note: 'left', octave: 0, instrument: 'synthPad', color: NEON_COLORS.PURPLE, displayName: '← - Left' },
  { key: 'arrowright', note: 'right', octave: 0, instrument: 'synthLead', color: NEON_COLORS.PINK, displayName: '→ - Right' },

  // Function keys - Special effects
  { key: 'f1', note: 'magic1', octave: 0, instrument: 'fmBell', color: NEON_COLORS.MAGENTA, displayName: 'F1 - Magic 1' },
  { key: 'f2', note: 'magic2', octave: 0, instrument: 'fmBell', color: NEON_COLORS.CYAN, displayName: 'F2 - Magic 2' },
  { key: 'f3', note: 'magic3', octave: 0, instrument: 'fmBell', color: NEON_COLORS.YELLOW, displayName: 'F3 - Magic 3' },
  { key: 'f4', note: 'magic4', octave: 0, instrument: 'fmBell', color: NEON_COLORS.GREEN, displayName: 'F4 - Magic 4' },
  { key: 'f5', note: 'magic5', octave: 0, instrument: 'fmBell', color: NEON_COLORS.ORANGE, displayName: 'F5 - Magic 5' },
  { key: 'f6', note: 'magic6', octave: 0, instrument: 'fmBell', color: NEON_COLORS.PURPLE, displayName: 'F6 - Magic 6' },
  { key: 'f7', note: 'magic7', octave: 0, instrument: 'fmBell', color: NEON_COLORS.PINK, displayName: 'F7 - Magic 7' },
  { key: 'f8', note: 'magic8', octave: 0, instrument: 'fmBell', color: NEON_COLORS.LIME, displayName: 'F8 - Magic 8' },
  { key: 'f9', note: 'magic9', octave: 0, instrument: 'arpeggiate', color: NEON_COLORS.MAGENTA, displayName: 'F9 - Magic 9' },
  { key: 'f10', note: 'magic10', octave: 0, instrument: 'arpeggiate', color: NEON_COLORS.CYAN, displayName: 'F10 - Magic 10' },
  { key: 'f11', note: 'magic11', octave: 0, instrument: 'arpeggiate', color: NEON_COLORS.YELLOW, displayName: 'F11 - Magic 11' },
  { key: 'f12', note: 'magic12', octave: 0, instrument: 'arpeggiate', color: NEON_COLORS.GREEN, displayName: 'F12 - Magic 12' },

  // Additional special keys
  { key: 'backspace', note: 'delete', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.ORANGE, displayName: 'Backspace - Delete Sound' },
  { key: 'delete', note: 'zap', octave: 0, instrument: 'digitalDrum', color: NEON_COLORS.PURPLE, displayName: 'Delete - Zap' },
  { key: 'home', note: 'home', octave: 0, instrument: 'synthPad', color: NEON_COLORS.PINK, displayName: 'Home - Home Sound' },
  { key: 'end', note: 'end', octave: 0, instrument: 'synthPad', color: NEON_COLORS.LIME, displayName: 'End - End Sound' },
  { key: 'pageup', note: 'pageup', octave: 0, instrument: 'arpeggiate', color: NEON_COLORS.MAGENTA, displayName: 'PgUp - Page Up' },
  { key: 'pagedown', note: 'pagedown', octave: 0, instrument: 'synthBass', color: NEON_COLORS.CYAN, displayName: 'PgDn - Page Down' },
  { key: 'insert', note: 'insert', octave: 0, instrument: 'fmBell', color: NEON_COLORS.YELLOW, displayName: 'Ins - Insert' },

  // Escape key - Special cosmic sound
  { key: 'escape', note: 'cosmic', octave: 0, instrument: 'fmBell', color: NEON_COLORS.GREEN, displayName: 'Esc - Cosmic' }
];

// Create lookup maps for quick access
export const KEY_TO_MAPPING: Map<string, KeyMapping> = new Map(
  KEYBOARD_MAPPINGS.map(mapping => [mapping.key, mapping])
);

export const getKeyMapping = (key: string): KeyMapping | null => {
  return KEY_TO_MAPPING.get(key.toLowerCase()) || null;
};

// Helper to calculate frequency from note and octave
export const getFrequency = (note: string, octave: number): number => {
  const baseFreq = NOTE_FREQUENCIES[note.toUpperCase()];
  if (!baseFreq) return 440; // Default to A4
  
  // Calculate frequency based on octave (A4 = 440Hz is octave 4)
  const octaveMultiplier = Math.pow(2, octave - 4);
  return baseFreq * octaveMultiplier;
};

// Special drum frequencies for noise-based instruments
export const DRUM_FREQUENCIES: Record<string, number> = {
  // Basic drums
  kick: 60,
  snare: 200,
  hihat: 8000,
  crash: 3000,
  clap: 1000,
  
  // Extended drums
  tom1: 120,
  tom2: 150,
  tom3: 180,
  cymbal: 4000,
  cowbell: 800,
  openhat: 6000,
  ride: 2500,
  
  // Special effect sounds
  whoosh: 500,
  laser: 1500,
  sparkle: 2000,
  echo: 300,
  bounce: 700,
  rainbow: 1200,
  
  // Movement sounds
  up: 880,
  down: 440,
  left: 660,
  right: 550,
  
  // Magic sounds (F-keys)
  magic1: 1760,
  magic2: 1567,
  magic3: 1397,
  magic4: 1319,
  magic5: 1175,
  magic6: 1047,
  magic7: 932,
  magic8: 831,
  magic9: 740,
  magic10: 659,
  magic11: 587,
  magic12: 523,
  
  // Utility sounds
  delete: 150,
  zap: 2200,
  home: 523,
  end: 262,
  pageup: 1047,
  pagedown: 131,
  insert: 784,
  cosmic: 1661,
  
  // Power sounds
  powerchord: 220
};