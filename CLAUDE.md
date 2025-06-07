# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Keyboard Cosmic Jam** - An 80s-themed musical keyboard game for ages 3-6 that transforms the computer keyboard into a magical synthesizer with instant audio-visual feedback.

## Tech Stack

- **TypeScript 5.x** with Vite 5.x for build tooling
- **PixiJS 8.x** for hardware-accelerated 2D graphics
- **Tone.js** for Web Audio API and musical timing
- **Howler.js** as audio fallback for mobile
- **GSAP 3.x** for animations
- **Zustand** for state management

## Common Commands

```bash
# Development
npm run dev          # Start dev server (port 5173)
npm run dev:mobile   # Dev with mobile debugging enabled

# Building
npm run build        # Production build to dist/
npm run preview      # Preview production build locally

# Testing (not yet configured)
npm run test         # Run Jest unit tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run Playwright E2E tests

# Code Quality
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix linting issues
npm run typecheck    # TypeScript type checking

# Asset Pipeline (scripts not yet created)
npm run optimize:audio    # Compress audio files
npm run generate:sprites  # Create sprite sheets from images
```

## Architecture Overview

The codebase follows a modular architecture with clear separation of concerns:

```
src/
├── game/          # Core game logic (non-UI)
│   ├── core/      # Game loop, input handling, state management
│   ├── audio/     # AudioEngine, instruments, sound effects
│   ├── visuals/   # VisualEngine, particle systems, animations
│   └── modes/     # Story mode levels, sandbox mode logic
├── ui/            # UI components and screens
└── utils/         # Shared utilities and helpers
```

### Key Systems

1. **Input System**: Handles both keyboard and touch input with adaptive zones
2. **Audio Engine**: Web Audio API-based system with instrument banks and effects
3. **Visual Engine**: PixiJS-based rendering with particle effects and animations
4. **Game Modes**: Story mode (guided levels) and Sandbox mode (free play)

## Development Guidelines

### Audio Implementation
- Use Tone.js for musical timing and synthesis
- Fallback to Howler.js for mobile compatibility
- Audio files: WebM/MP3 dual format, ~96kbps for music, ~64kbps for SFX
- Instrument banks: retro, nature, silly, world

### Visual Standards
- Neon color palette: #FF00FF, #00FFFF, #FFFF00, #FF00AA
- 2x resolution sprites for retina displays
- WebP format with PNG fallback
- 60 FPS target on 2019+ devices

### Mobile Optimization
- Responsive touch zones that adapt to screen orientation
- < 50MB total download size
- PWA support for offline play
- < 3 second load time on 3G

### Git Workflow
- Feature branches from `develop`
- Commit format: `type(scope): subject`
- Types: feat, fix, perf, docs, refactor, test
- Rebase feature branches before merging

## Key Implementation Details

### Input Zones Structure
```typescript
interface InputZone {
  keys: string[];        // Keyboard keys
  touchArea: Rectangle;  // Screen region for mobile
  sound: SoundConfig;    // Associated sound
  visual: VisualEffect;  // Particle/animation config
}
```

### Performance Targets
- Initial load: < 3 seconds
- Audio latency: < 20ms
- Memory usage: < 200MB RAM
- Consistent 60 FPS gameplay

## Testing Focus Areas
- Keyboard input responsiveness
- Touch zone accuracy on mobile
- Audio playback across devices
- Visual performance on low-end hardware
- Offline functionality