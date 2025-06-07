# 🎯 Comprehensive Testing Plan - Keyboard Cosmic Jam

## 📋 Executive Summary

This document outlines a comprehensive testing strategy to achieve **90% code coverage** across all project components including unit, integration, and system tests. The testing plan covers the entire codebase architecture with focus on reliability, performance, and user experience.

---

## 🏗️ Project Architecture Overview

### Core Systems
- **Audio Engine**: Web Audio API synthesis, instruments, effects
- **Visual Engine**: PixiJS rendering, particle effects, animations  
- **Game Engine**: Central orchestration, event management
- **Input Manager**: Keyboard and touch input handling
- **UI Components**: React-like component system
- **Game Systems**: Scoring, achievements, progression, story mode
- **Data Persistence**: localStorage, recordings management

### Technology Stack
- **Frontend**: TypeScript, PixiJS, GSAP, Tone.js
- **Audio**: Web Audio API, Howler.js
- **Testing**: Jest, Vitest, @testing-library
- **Build**: Vite, ESBuild

---

## 🧪 Testing Strategy Overview

### Coverage Targets
- **Unit Tests**: 95% coverage of individual components
- **Integration Tests**: 90% coverage of system interactions  
- **System Tests**: 85% coverage of end-to-end workflows
- **Performance Tests**: Critical path timing validation
- **Accessibility Tests**: WCAG compliance verification

### Testing Pyramid
```
    System Tests (15%)
      E2E workflows
      User journeys
      Performance
    
    Integration Tests (35%)
      Component interactions
      Event flow validation
      Cross-system integration
    
    Unit Tests (50%)
      Individual components
      Pure functions
      Business logic
```

---

## 📝 Unit Testing Plan (50% of effort)

### 🎵 Audio Engine (`src/game/audio/`)

#### AudioEngine.test.ts ✅ (Existing)
**Coverage Target: 95%**

**Current Coverage:**
- ✅ Initialization and context creation
- ✅ Instrument switching and sound generation
- ✅ Volume control and audio effects
- ✅ Error handling and cleanup

**Missing Tests to Add:**
```typescript
describe('AudioEngine Extended', () => {
  describe('advanced synthesis', () => {
    it('should layer multiple oscillators for rich sounds')
    it('should apply real-time effects processing')
    it('should handle polyphonic sound generation')
    it('should manage audio context suspension/resume')
  })

  describe('performance optimization', () => {
    it('should reuse audio nodes efficiently')
    it('should handle rapid note triggering without clicks')
    it('should manage memory usage with long sessions')
  })

  describe('edge cases', () => {
    it('should handle audio context creation failure')
    it('should work with no audio output device')
    it('should handle extremely high/low frequencies')
  })
})
```

#### RecordingEngine.test.ts (NEW)
**Coverage Target: 92%**

```typescript
describe('RecordingEngine', () => {
  describe('recording functionality', () => {
    it('should start recording with timestamp')
    it('should capture note events with accurate timing')
    it('should handle overlapping notes')
    it('should stop recording and return complete data')
  })

  describe('playback system', () => {
    it('should play recordings at original tempo')
    it('should support playback speed adjustment')
    it('should handle playback pause/resume')
    it('should emit events during playback')
  })

  describe('data management', () => {
    it('should export recordings as JSON')
    it('should import external recordings')
    it('should validate recording format')
    it('should compress large recordings')
  })

  describe('error handling', () => {
    it('should handle corrupted recording data')
    it('should manage recording storage limits')
    it('should recover from playback errors')
  })
})
```

### 🎨 Visual Engine (`src/game/visuals/`)

#### VisualEngine.test.ts (NEW)
**Coverage Target: 93%**

```typescript
describe('VisualEngine', () => {
  describe('initialization', () => {
    it('should create PIXI application with correct settings')
    it('should initialize background effects')
    it('should setup touch zone renderer')
    it('should handle WebGL fallback to canvas')
  })

  describe('effect generation', () => {
    it('should create instrument-specific visual effects')
    it('should manage effect lifecycle and cleanup')
    it('should handle rapid effect generation')
    it('should animate effects with proper timing')
  })

  describe('touch zone rendering', () => {
    it('should render touch zones based on screen size')
    it('should update zones on orientation change')
    it('should highlight active zones')
    it('should manage zone visibility states')
  })

  describe('background effects', () => {
    it('should render animated starfield')
    it('should create perspective grid effects')
    it('should handle effect enable/disable')
    it('should optimize performance with large star counts')
  })

  describe('score visualization', () => {
    it('should create score popup animations')
    it('should display combo multipliers')
    it('should show achievement celebrations')
    it('should handle celebration effect overlaps')
  })
})
```

#### BackgroundEffects.test.ts (NEW)
**Coverage Target: 90%**

```typescript
describe('BackgroundEffects', () => {
  describe('starfield effects', () => {
    it('should generate stars with random properties')
    it('should animate star movement realistically')
    it('should handle star recycling at screen edges')
    it('should adjust density based on performance')
  })

  describe('neon grid effects', () => {
    it('should create perspective grid lines')
    it('should animate grid with color cycling')
    it('should adjust grid spacing dynamically')
    it('should optimize grid complexity for mobile')
  })

  describe('performance management', () => {
    it('should reduce effects on low-end devices')
    it('should maintain 60fps target')
    it('should handle window resize efficiently')
  })
})
```

#### TouchZoneRenderer.test.ts (NEW)
**Coverage Target: 88%**

```typescript
describe('TouchZoneRenderer', () => {
  describe('zone layout', () => {
    it('should calculate optimal zone positions')
    it('should adapt to different screen sizes')
    it('should handle portrait/landscape orientations')
    it('should prevent zone overlaps')
  })

  describe('visual feedback', () => {
    it('should show zone boundaries when needed')
    it('should highlight zones on interaction')
    it('should animate zone state changes')
    it('should provide accessibility indicators')
  })

  describe('auto-management', () => {
    it('should show zones for new users')
    it('should hide zones for experienced users')
    it('should toggle zones with user gesture')
  })
})
```

### 🎮 Core Game Systems (`src/game/core/`)

#### GameEngine.test.ts (NEW)
**Coverage Target: 94%**

```typescript
describe('GameEngine', () => {
  describe('system orchestration', () => {
    it('should initialize all subsystems correctly')
    it('should coordinate input -> audio -> visual flow')
    it('should handle system startup/shutdown')
    it('should manage game loop timing')
  })

  describe('event flow', () => {
    it('should route keyboard events to audio system')
    it('should trigger visual effects on sound play')
    it('should update scoring on note events')
    it('should emit achievement unlocks')
  })

  describe('mode management', () => {
    it('should switch between sandbox and story modes')
    it('should maintain mode-specific state')
    it('should handle mode transitions cleanly')
  })

  describe('recording integration', () => {
    it('should coordinate recording across systems')
    it('should handle playback with all effects')
    it('should manage recording state consistently')
  })

  describe('error recovery', () => {
    it('should handle subsystem failures gracefully')
    it('should maintain game state during errors')
    it('should provide meaningful error feedback')
  })
})
```

#### ScoringSystem.test.ts ✅ (Existing - Enhance)
**Current Coverage: ~85% - Target: 94%**

**Add these test cases:**
```typescript
describe('ScoringSystem Advanced', () => {
  describe('complex scoring scenarios', () => {
    it('should handle rapid note sequences')
    it('should calculate accuracy over time')
    it('should manage score multiplier decay')
    it('should handle simultaneous note scoring')
  })

  describe('performance metrics', () => {
    it('should track notes per minute')
    it('should calculate session averages')
    it('should identify performance patterns')
  })

  describe('data persistence', () => {
    it('should save high scores')
    it('should track long-term progress')
    it('should handle score data migration')
  })
})
```

#### AchievementSystem.test.ts ✅ (Existing - Enhance) 
**Current Coverage: ~87% - Target: 93%**

**Add these test cases:**
```typescript
describe('AchievementSystem Advanced', () => {
  describe('complex achievements', () => {
    it('should track multi-session achievements')
    it('should handle conditional achievement unlocks')
    it('should manage achievement prerequisites')
    it('should prevent achievement spoofing')
  })

  describe('social features', () => {
    it('should generate shareable achievement data')
    it('should validate imported achievements')
    it('should handle achievement migrations')
  })
})
```

#### ProgressionSystem.test.ts ✅ (Existing - Enhance)
**Current Coverage: ~86% - Target: 92%**

#### GameState.test.ts ✅ (Existing - Enhance)  
**Current Coverage: ~89% - Target: 94%**

#### InputManager.test.ts (NEW)
**Coverage Target: 91%**

```typescript
describe('InputManager', () => {
  describe('keyboard input', () => {
    it('should map keys to musical notes')
    it('should handle key repeat prevention')
    it('should manage modifier key combinations')
    it('should support custom key mappings')
  })

  describe('touch input', () => {
    it('should detect touch zones accurately')
    it('should handle multi-touch scenarios')
    it('should convert touch to note events')
    it('should prevent accidental touches')
  })

  describe('input validation', () => {
    it('should filter out invalid inputs')
    it('should handle rapid input sequences')
    it('should manage input timing accuracy')
  })

  describe('accessibility', () => {
    it('should support keyboard navigation')
    it('should handle assistive device input')
    it('should provide input feedback')
  })
})
```

### 🎪 Game Modes (`src/game/modes/`)

#### StoryMode.test.ts ✅ (Existing - Enhance)
**Current Coverage: ~83% - Target: 91%**

**Add these test cases:**
```typescript
describe('StoryMode Advanced', () => {
  describe('level progression', () => {
    it('should unlock levels based on performance')
    it('should track completion statistics')
    it('should handle level replay mechanics')
    it('should manage level difficulty scaling')
  })

  describe('narrative elements', () => {
    it('should trigger story events at milestones')
    it('should manage character interactions')
    it('should handle story state persistence')
  })

  describe('adaptive difficulty', () => {
    it('should adjust difficulty based on player skill')
    it('should provide appropriate challenges')
    it('should maintain engagement curves')
  })
})
```

### 🎛️ UI Components (`src/ui/`)

#### App.test.ts (NEW)
**Coverage Target: 89%**

```typescript
describe('App Initialization', () => {
  describe('component setup', () => {
    it('should initialize all UI components')
    it('should connect components to game engine')
    it('should handle component lifecycle')
    it('should manage component state')
  })

  describe('event handling', () => {
    it('should route game events to UI components')
    it('should handle user interactions correctly')
    it('should manage keyboard shortcuts')
  })

  describe('responsive layout', () => {
    it('should adapt to different screen sizes')
    it('should handle orientation changes')
    it('should maintain usability on mobile')
  })
})
```

#### Component Tests (NEW for each major component)

**ScoreDisplay.test.ts**
```typescript
describe('ScoreDisplay', () => {
  it('should update score in real-time')
  it('should animate score changes')
  it('should show combo indicators')
  it('should handle large numbers')
  it('should display accuracy percentages')
})
```

**AchievementDisplay.test.ts**
```typescript
describe('AchievementDisplay', () => {
  it('should show achievement progress')
  it('should animate unlock notifications')
  it('should handle achievement categories')
  it('should provide achievement details')
})
```

**LevelSelect.test.ts**
```typescript
describe('LevelSelect', () => {
  it('should show available levels')
  it('should indicate completion status')
  it('should handle level selection')
  it('should show level requirements')
})
```

**InstrumentSelector.test.ts**
```typescript
describe('InstrumentSelector', () => {
  it('should display available instruments')
  it('should show unlock status')
  it('should handle instrument switching')
  it('should preview instrument sounds')
})
```

**RecordingControls.test.ts**
```typescript
describe('RecordingControls', () => {
  it('should start/stop recordings')
  it('should show recording status')
  it('should handle playback controls')
  it('should manage recording list')
})
```

**ToddlerMode.test.ts**
```typescript
describe('ToddlerMode', () => {
  it('should simplify interface for young users')
  it('should prevent accidental navigation')
  it('should use larger touch targets')
  it('should provide clear visual feedback')
})
```

### 🛠️ Utilities (`src/utils/`)

#### EventEmitter.test.ts ✅ (Existing - Complete)
**Current Coverage: ~92% - Target: 95%**

#### Device Detection Tests (NEW)
```typescript
describe('Device Detection', () => {
  it('should detect mobile devices')
  it('should identify touch capabilities')
  it('should determine performance tier')
  it('should handle browser variations')
})
```

#### Performance Monitoring Tests (NEW)
```typescript
describe('Performance Monitoring', () => {
  it('should track frame rate')
  it('should measure audio latency')
  it('should monitor memory usage')
  it('should detect performance degradation')
})
```

#### Storage Utilities Tests (NEW)
```typescript
describe('Storage Utilities', () => {
  it('should handle localStorage safely')
  it('should manage data compression')
  it('should handle storage quota limits')
  it('should provide data migration')
})
```

---

## 🔗 Integration Testing Plan (35% of effort)

### System Integration Tests

#### Audio-Visual Integration
```typescript
describe('Audio-Visual Integration', () => {
  it('should trigger visual effects when audio plays')
  it('should synchronize effect timing with audio')
  it('should handle audio-visual cleanup together')
  it('should maintain sync during high load')
})
```

#### Input-Game Integration  
```typescript
describe('Input-Game Integration', () => {
  it('should route input through complete game pipeline')
  it('should update all systems on user interaction')
  it('should handle rapid input without lag')
  it('should maintain state consistency across systems')
})
```

#### UI-Core Integration
```typescript
describe('UI-Core Integration', () => {
  it('should reflect game state changes in UI')
  it('should handle UI events in game logic')
  it('should maintain UI responsiveness during gameplay')
  it('should handle component mounting/unmounting')
})
```

#### Persistence Integration
```typescript
describe('Persistence Integration', () => {
  it('should save/load complete game state')
  it('should handle data migration between versions')
  it('should maintain data integrity')
  it('should recover from storage corruption')
})
```

### Cross-System Event Flow Tests

#### Complete Interaction Flow
```typescript
describe('Complete Interaction Flow', () => {
  it('should handle: Input → Audio → Visual → Score → Achievement')
  it('should maintain event timing across systems')
  it('should handle system errors gracefully')
  it('should cleanup resources after interactions')
})
```

#### Recording Integration
```typescript
describe('Recording Integration', () => {
  it('should record all system interactions')
  it('should replay interactions accurately')
  it('should handle recording during gameplay')
  it('should manage recording storage efficiently')
})
```

#### Story Mode Integration
```typescript
describe('Story Mode Integration', () => {
  it('should coordinate level progress across systems')
  it('should trigger story events correctly')
  it('should handle level transitions smoothly')
  it('should maintain progression state')
})
```

---

## 🌐 System Testing Plan (15% of effort)

### End-to-End User Journeys

#### New Player Experience
```typescript
describe('New Player Journey', () => {
  it('should guide through first-time setup')
  it('should teach basic game mechanics')
  it('should unlock first achievements')
  it('should save progress correctly')
})
```

#### Progression Journey
```typescript
describe('Progression Journey', () => {
  it('should unlock content based on skill')
  it('should provide meaningful challenges')
  it('should maintain long-term engagement')
  it('should handle skill plateaus')
})
```

#### Creative Journey
```typescript
describe('Creative Journey', () => {
  it('should support free-form musical creation')
  it('should enable recording and sharing')
  it('should provide creative tools')
  it('should inspire musical exploration')
})
```

### Performance & Load Testing

#### Performance Benchmarks
```typescript
describe('Performance Tests', () => {
  it('should maintain 60fps during complex visuals')
  it('should handle 10+ simultaneous notes')
  it('should load within 3 seconds')
  it('should use <100MB memory during typical sessions')
})
```

#### Stress Testing
```typescript
describe('Stress Tests', () => {
  it('should handle rapid input sequences')
  it('should manage long gameplay sessions')
  it('should recover from memory pressure')
  it('should handle tab switching gracefully')
})
```

#### Mobile Performance
```typescript
describe('Mobile Performance', () => {
  it('should perform well on mid-range devices')
  it('should optimize for battery life')
  it('should handle orientation changes')
  it('should work on slow networks')
})
```

### Browser Compatibility

#### Cross-Browser Testing
```typescript
describe('Browser Compatibility', () => {
  it('should work in Chrome/Edge/Firefox/Safari')
  it('should handle Web Audio API variations')
  it('should fall back gracefully on older browsers')
  it('should maintain feature parity across browsers')
})
```

### Accessibility Testing

#### WCAG Compliance
```typescript
describe('Accessibility', () => {
  it('should support screen readers')
  it('should provide keyboard navigation')
  it('should offer high contrast modes')
  it('should support reduced motion preferences')
})
```

---

## 🚀 Performance Testing Plan

### Audio Performance
- **Latency**: Audio input to output <20ms
- **Polyphony**: Support 16+ simultaneous notes
- **Stability**: No audio dropouts during 30min sessions

### Visual Performance  
- **Frame Rate**: Maintain 60fps with full effects
- **Memory**: Visual system <50MB memory usage
- **Startup**: Visual engine ready <1 second

### Interaction Performance
- **Input Lag**: Touch/keyboard to audio <10ms
- **Visual Response**: Input to visual effect <16ms
- **UI Responsiveness**: All UI interactions <100ms

### Data Performance
- **Save/Load**: Complete state save/load <200ms
- **Recording**: Start/stop recording <50ms
- **Storage**: Efficient data compression

---

## 📊 Test File Organization

```
tests/
├── unit/                          # Unit tests (50% of coverage)
│   ├── audio/
│   │   ├── AudioEngine.test.ts ✅
│   │   └── RecordingEngine.test.ts
│   ├── visuals/
│   │   ├── VisualEngine.test.ts
│   │   ├── BackgroundEffects.test.ts
│   │   └── TouchZoneRenderer.test.ts
│   ├── core/
│   │   ├── GameEngine.test.ts
│   │   ├── GameState.test.ts ✅
│   │   ├── InputManager.test.ts
│   │   ├── ScoringSystem.test.ts ✅
│   │   ├── AchievementSystem.test.ts ✅
│   │   └── ProgressionSystem.test.ts ✅
│   ├── modes/
│   │   └── StoryMode.test.ts ✅
│   ├── ui/
│   │   ├── App.test.ts
│   │   └── components/
│   │       ├── ScoreDisplay.test.ts
│   │       ├── AchievementDisplay.test.ts
│   │       ├── LevelSelect.test.ts
│   │       ├── InstrumentSelector.test.ts
│   │       ├── RecordingControls.test.ts
│   │       └── ToddlerMode.test.ts
│   └── utils/
│       ├── EventEmitter.test.ts ✅
│       ├── DeviceDetection.test.ts
│       ├── Performance.test.ts
│       └── Storage.test.ts
├── integration/                   # Integration tests (35% of coverage)
│   ├── audio-visual.test.ts
│   ├── input-game.test.ts
│   ├── ui-core.test.ts
│   ├── persistence.test.ts
│   ├── event-flow.test.ts
│   ├── recording-integration.test.ts
│   └── story-mode-integration.test.ts
├── system/                        # System tests (15% of coverage)
│   ├── user-journeys/
│   │   ├── new-player.test.ts
│   │   ├── progression.test.ts
│   │   └── creative.test.ts
│   ├── performance/
│   │   ├── load-testing.test.ts
│   │   ├── stress-testing.test.ts
│   │   └── mobile-performance.test.ts
│   ├── compatibility/
│   │   ├── browser-testing.test.ts
│   │   └── accessibility.test.ts
│   └── e2e/
│       ├── complete-gameplay.test.ts
│       ├── progression-flow.test.ts
│       └── data-persistence.test.ts
├── fixtures/                      # Test data and mocks
│   ├── sample-recordings.json
│   ├── achievement-data.json
│   ├── level-configurations.json
│   └── audio-samples/
├── helpers/                       # Test utilities
│   ├── test-setup.ts
│   ├── mock-factories.ts
│   ├── assertion-helpers.ts
│   └── performance-helpers.ts
└── config/                       # Test configurations
    ├── jest.unit.config.js
    ├── jest.integration.config.js
    ├── jest.system.config.js
    └── playwright.config.js
```

---

## 🎯 Coverage Goals & Metrics

### Overall Coverage Targets
- **Total Project Coverage**: 90%+
- **Critical Path Coverage**: 95%+
- **User Journey Coverage**: 85%+
- **Error Path Coverage**: 80%+

### Per-System Coverage
| System | Unit Tests | Integration | System | Total Target |
|--------|------------|-------------|---------|--------------|
| Audio Engine | 95% | 90% | 85% | 92% |
| Visual Engine | 93% | 88% | 80% | 89% |
| Game Engine | 94% | 92% | 90% | 93% |
| Input Manager | 91% | 89% | 85% | 89% |
| UI Components | 89% | 85% | 80% | 86% |
| Game Systems | 93% | 90% | 85% | 91% |
| Story Mode | 91% | 88% | 85% | 89% |
| Utilities | 95% | 85% | 75% | 89% |

### Quality Metrics
- **Test Reliability**: 99%+ pass rate
- **Test Performance**: <5min full suite execution
- **Maintenance**: <2hrs/month test maintenance
- **Coverage Accuracy**: True coverage, not just line hits

---

## 🛠️ Test Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. **Complete Unit Test Coverage**
   - Implement missing unit tests
   - Enhance existing tests to target coverage
   - Create comprehensive mocks and fixtures

2. **Test Infrastructure**
   - Setup test configurations
   - Create helper utilities
   - Establish performance baselines

### Phase 2: Integration (Week 3-4)
1. **System Integration Tests**
   - Audio-visual synchronization
   - Input processing pipeline
   - UI state management

2. **Event Flow Testing**
   - Complete interaction chains
   - Error propagation handling
   - Resource cleanup verification

### Phase 3: System Testing (Week 5-6)
1. **End-to-End Scenarios**
   - User journey automation
   - Performance benchmarking
   - Accessibility validation

2. **Compatibility Testing**
   - Cross-browser verification
   - Mobile device testing
   - Progressive enhancement

### Phase 4: Optimization (Week 7-8)
1. **Performance Tuning**
   - Test execution optimization
   - Coverage gap analysis
   - False positive elimination

2. **Documentation & Training**
   - Test documentation
   - Contributor guidelines
   - CI/CD integration

---

## 🔧 Test Configuration & Tools

### Primary Testing Stack
- **Unit Tests**: Jest with ts-jest
- **Integration Tests**: Jest with enhanced setup
- **E2E Tests**: Playwright
- **Performance**: Custom benchmarking tools
- **Coverage**: Jest built-in + c8

### Mock Strategy
- **Audio APIs**: Comprehensive Web Audio mocking
- **Visual APIs**: PixiJS and Canvas mocking  
- **Storage**: localStorage and indexedDB simulation
- **Timing**: Controllable time and animation mocking
- **Network**: Service worker and fetch mocking

### CI/CD Integration
```yaml
test:
  unit:
    command: "npm run test:unit"
    coverage: 95%
    timeout: 300s
  
  integration:
    command: "npm run test:integration"
    coverage: 90%
    timeout: 600s
    
  e2e:
    command: "npm run test:e2e"
    browsers: [chrome, firefox, safari]
    timeout: 1200s

  performance:
    command: "npm run test:performance"
    benchmarks: required
    regression: <5%
```

---

## 📈 Success Criteria

### Coverage Metrics
- ✅ 90%+ total project coverage
- ✅ 95%+ critical path coverage  
- ✅ Zero uncovered error paths
- ✅ Complete API surface testing

### Quality Metrics
- ✅ <1% flaky test rate
- ✅ <5min full test suite execution
- ✅ 100% automated test execution
- ✅ Zero manual testing requirements

### Performance Metrics
- ✅ All performance benchmarks pass
- ✅ Memory usage within targets
- ✅ Cross-browser compatibility verified
- ✅ Accessibility standards met

---

## 🎉 Expected Outcomes

### Immediate Benefits
- **Confidence**: Deploy with 90%+ coverage confidence
- **Quality**: Catch 95%+ of bugs before production
- **Performance**: Maintain performance standards automatically
- **Maintainability**: Refactor safely with comprehensive test suite

### Long-term Benefits  
- **Developer Velocity**: Faster feature development
- **User Experience**: Higher quality, fewer bugs
- **Code Quality**: Better architecture through testability
- **Team Productivity**: Reduced debugging and hotfix time

---

## 📚 Test Documentation Standards

### Test File Requirements
- **Clear Descriptions**: Every test clearly states what it validates
- **Comprehensive Coverage**: Each test file covers all public APIs
- **Performance Notes**: Tests include performance expectations
- **Error Scenarios**: Comprehensive error condition testing

### Code Quality Standards
- **Type Safety**: All tests fully typed with TypeScript
- **Mock Management**: Proper mock setup and cleanup
- **Test Isolation**: No dependencies between tests
- **Resource Cleanup**: Proper cleanup of resources and timers

---

This comprehensive testing plan provides a roadmap to achieve 90% code coverage with high-quality, maintainable tests that ensure the reliability and performance of the Keyboard Cosmic Jam music game application.
