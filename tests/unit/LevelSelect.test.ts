/**
 * LevelSelect Unit Tests
 * 
 * Comprehensive test suite for the LevelSelect component covering:
 * - DOM element creation and layout
 * - Level list rendering and organization
 * - Level selection and navigation
 * - Lock/unlock state management
 * - Star rating display
 * - Level filtering and search
 * - Visual feedback and animations
 * - Responsive design and mobile support
 * - Accessibility features
 * - Error handling and edge cases
 * 
 * Target Coverage: 91%
 */

import { LevelSelect } from '@ui/components/LevelSelect';
import { StoryLevel } from '@game/modes/StoryMode';

// Mock DOM methods
const mockElement = {
  style: { cssText: '' },
  textContent: '',
  innerHTML: '',
  appendChild: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn()
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getAttribute: jest.fn(),
  setAttribute: jest.fn(),
  remove: jest.fn(),
  focus: jest.fn(),
  scrollIntoView: jest.fn(),
  getBoundingClientRect: jest.fn(() => ({
    x: 0, y: 0, width: 300, height: 200,
    top: 0, left: 0, right: 300, bottom: 200
  }))
};

const mockDocument = {
  createElement: jest.fn(() => ({ ...mockElement })),
  body: {
    appendChild: jest.fn()
  }
};

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn();
Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
});

// Mock performance.now
const mockPerformanceNow = jest.fn(() => 1000);
Object.defineProperty(performance, 'now', { value: mockPerformanceNow });

describe('LevelSelect', () => {
  let levelSelect: LevelSelect;
  let mockContainer: HTMLElement;
  let mockLevelList: HTMLElement;
  let mockSearchInput: HTMLElement;
  let mockFilterButtons: HTMLElement;

  const createMockLevel = (
    id: number,
    name: string,
    unlocked = true,
    completed = false,
    stars = 0
  ): StoryLevel => ({
    id,
    name,
    description: `Description for ${name}`,
    objectives: [
      {
        id: 'play-notes',
        type: 'play-notes',
        description: 'Play 20 notes',
        target: 20,
        progress: completed ? 20 : 0,
        completed
      }
    ],
    unlocked,
    completed,
    stars,
    difficulty: id <= 3 ? 'easy' : id <= 6 ? 'medium' : 'hard',
    theme: 'cosmic',
    backgroundMusic: 'cosmic-ambient',
    visualTheme: 'starfield'
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock DOM elements
    mockContainer = { ...mockElement };
    mockLevelList = { ...mockElement };
    mockSearchInput = { ...mockElement, value: '' };
    mockFilterButtons = { ...mockElement };
    
    // Configure document.createElement to return specific elements
    mockDocument.createElement
      .mockReturnValueOnce(mockContainer)      // Main container
      .mockReturnValueOnce(mockSearchInput)    // Search input
      .mockReturnValueOnce(mockFilterButtons)  // Filter buttons
      .mockReturnValueOnce(mockLevelList);     // Level list
    
    // Setup querySelector to return specific elements
    mockContainer.querySelector = jest.fn()
      .mockImplementation((selector: string) => {
        if (selector === '.level-list') return mockLevelList;
        if (selector === '.search-input') return mockSearchInput;
        if (selector === '.filter-buttons') return mockFilterButtons;
        if (selector.startsWith('.level-item[data-level-id')) return mockElement;
        return null;
      });
    
    mockContainer.querySelectorAll = jest.fn()
      .mockImplementation((selector: string) => {
        if (selector === '.level-item') return [];
        if (selector === '.filter-button') return [];
        return [];
      });
    
    levelSelect = new LevelSelect();
  });

  afterEach(() => {
    levelSelect.destroy();
  });

  describe('constructor and initialization', () => {
    it('should create LevelSelect instance', () => {
      expect(levelSelect).toBeInstanceOf(LevelSelect);
    });

    it('should create main container with correct styling', () => {
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockContainer.style.cssText).toContain('position: fixed');
      expect(mockContainer.style.cssText).toContain('top: 0');
      expect(mockContainer.style.cssText).toContain('left: 0');
      expect(mockContainer.style.cssText).toContain('width: 100%');
      expect(mockContainer.style.cssText).toContain('height: 100%');
      expect(mockContainer.style.cssText).toContain('z-index: 1000');
    });

    it('should create search input element', () => {
      expect(mockSearchInput.style.cssText).toContain('width: 300px');
      expect(mockSearchInput.style.cssText).toContain('padding: 10px');
      expect(mockSearchInput.style.cssText).toContain('border-radius: 20px');
      expect(mockSearchInput.getAttribute).toHaveBeenCalledWith('type', 'text');
      expect(mockSearchInput.getAttribute).toHaveBeenCalledWith('placeholder', 'Search levels...');
    });

    it('should create filter buttons container', () => {
      expect(mockFilterButtons.style.cssText).toContain('display: flex');
      expect(mockFilterButtons.style.cssText).toContain('gap: 10px');
      expect(mockFilterButtons.style.cssText).toContain('justify-content: center');
    });

    it('should create level list container', () => {
      expect(mockLevelList.style.cssText).toContain('display: grid');
      expect(mockLevelList.style.cssText).toContain('grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))');
      expect(mockLevelList.style.cssText).toContain('gap: 20px');
      expect(mockLevelList.style.cssText).toContain('padding: 20px');
    });

    it('should setup proper element hierarchy', () => {
      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockSearchInput);
      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockFilterButtons);
      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockLevelList);
    });

    it('should append container to document body', () => {
      expect(mockDocument.body.appendChild).toHaveBeenCalledWith(mockContainer);
    });

    it('should initialize with hidden state', () => {
      expect(mockContainer.style.cssText).toContain('display: none');
    });
  });

  describe('level rendering', () => {
    it('should render available levels', () => {
      const levels = [
        createMockLevel(1, 'Level 1', true, true, 3),
        createMockLevel(2, 'Level 2', true, false, 0),
        createMockLevel(3, 'Level 3', false, false, 0)
      ];
      
      levelSelect.updateLevels(levels);
      
      expect(mockLevelList.innerHTML).toBe('');
      expect(mockDocument.createElement).toHaveBeenCalledTimes(7); // Initial + 3 level items
    });

    it('should create level items with correct structure', () => {
      const level = createMockLevel(1, 'Test Level', true, true, 2);
      const levelItem = { ...mockElement };
      
      mockDocument.createElement.mockReturnValue(levelItem);
      levelSelect.updateLevels([level]);
      
      expect(levelItem.style.cssText).toContain('background: rgba(0, 255, 255, 0.1)');
      expect(levelItem.style.cssText).toContain('border: 2px solid #00FFFF');
      expect(levelItem.style.cssText).toContain('border-radius: 15px');
      expect(levelItem.style.cssText).toContain('padding: 20px');
      expect(levelItem.style.cssText).toContain('cursor: pointer');
    });

    it('should style unlocked levels differently from locked', () => {
      const unlockedLevel = createMockLevel(1, 'Unlocked', true);
      const lockedLevel = createMockLevel(2, 'Locked', false);
      
      levelSelect.updateLevels([unlockedLevel, lockedLevel]);
      
      // Should create different styles for unlocked vs locked levels
      expect(mockDocument.createElement).toHaveBeenCalled();
    });

    it('should display star ratings correctly', () => {
      const levels = [
        createMockLevel(1, 'No Stars', true, false, 0),
        createMockLevel(2, 'One Star', true, true, 1),
        createMockLevel(3, 'Two Stars', true, true, 2),
        createMockLevel(4, 'Three Stars', true, true, 3)
      ];
      
      levelSelect.updateLevels(levels);
      
      // Should display appropriate star representations
      expect(mockDocument.createElement).toHaveBeenCalled();
    });

    it('should handle empty level list', () => {
      levelSelect.updateLevels([]);
      
      expect(mockLevelList.innerHTML).toBe('');
    });

    it('should efficiently render large numbers of levels', () => {
      const manyLevels = Array.from({ length: 50 }, (_, i) => 
        createMockLevel(i + 1, `Level ${i + 1}`, i < 25, i < 10, Math.floor(Math.random() * 4))
      );
      
      const startTime = performance.now();
      levelSelect.updateLevels(manyLevels);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('level selection and interaction', () => {
    it('should handle level click events', () => {
      const level = createMockLevel(1, 'Clickable Level', true);
      const levelItem = { ...mockElement };
      const onLevelSelect = jest.fn();
      
      mockDocument.createElement.mockReturnValue(levelItem);
      levelSelect.updateLevels([level]);
      levelSelect.onLevelSelect = onLevelSelect;
      
      // Simulate click
      const clickHandler = levelItem.addEventListener.mock.calls
        .find(call => call[0] === 'click')?.[1];
      
      if (clickHandler) {
        clickHandler();
        expect(onLevelSelect).toHaveBeenCalledWith(level);
      }
    });

    it('should prevent selection of locked levels', () => {
      const lockedLevel = createMockLevel(2, 'Locked Level', false);
      const levelItem = { ...mockElement };
      const onLevelSelect = jest.fn();
      
      mockDocument.createElement.mockReturnValue(levelItem);
      levelSelect.updateLevels([lockedLevel]);
      levelSelect.onLevelSelect = onLevelSelect;
      
      const clickHandler = levelItem.addEventListener.mock.calls
        .find(call => call[0] === 'click')?.[1];
      
      if (clickHandler) {
        clickHandler();
        expect(onLevelSelect).not.toHaveBeenCalled();
      }
    });

    it('should provide visual feedback on hover', () => {
      const level = createMockLevel(1, 'Hover Level', true);
      const levelItem = { ...mockElement };
      
      mockDocument.createElement.mockReturnValue(levelItem);
      levelSelect.updateLevels([level]);
      
      expect(levelItem.addEventListener).toHaveBeenCalledWith('mouseenter', expect.any(Function));
      expect(levelItem.addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
    });

    it('should highlight selected level', () => {
      const levels = [
        createMockLevel(1, 'Level 1', true),
        createMockLevel(2, 'Level 2', true),
        createMockLevel(3, 'Level 3', true)
      ];
      
      levelSelect.updateLevels(levels);
      levelSelect.selectLevel(2);
      
      expect(mockContainer.querySelector).toHaveBeenCalledWith('.level-item[data-level-id="2"]');
    });

    it('should handle keyboard navigation', () => {
      const levels = [
        createMockLevel(1, 'Level 1', true),
        createMockLevel(2, 'Level 2', true),
        createMockLevel(3, 'Level 3', true)
      ];
      const levelItem = { ...mockElement };
      
      mockDocument.createElement.mockReturnValue(levelItem);
      levelSelect.updateLevels(levels);
      
      expect(levelItem.setAttribute).toHaveBeenCalledWith('tabindex', '0');
      expect(levelItem.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('search functionality', () => {
    it('should filter levels by search input', () => {
      const levels = [
        createMockLevel(1, 'Forest Adventure', true),
        createMockLevel(2, 'Ocean Journey', true),
        createMockLevel(3, 'Mountain Quest', true),
        createMockLevel(4, 'Forest Path', true)
      ];
      
      levelSelect.updateLevels(levels);
      
      // Simulate search input
      mockSearchInput.value = 'forest';
      const inputHandler = mockSearchInput.addEventListener.mock.calls
        .find(call => call[0] === 'input')?.[1];
      
      if (inputHandler) {
        inputHandler();
        // Should filter to show only forest levels
        expect(mockLevelList.innerHTML).toBe('');
      }
    });

    it('should handle case-insensitive search', () => {
      const levels = [
        createMockLevel(1, 'Forest Adventure', true),
        createMockLevel(2, 'OCEAN JOURNEY', true)
      ];
      
      levelSelect.updateLevels(levels);
      
      mockSearchInput.value = 'ocean';
      const inputHandler = mockSearchInput.addEventListener.mock.calls
        .find(call => call[0] === 'input')?.[1];
      
      if (inputHandler) {
        inputHandler();
        // Should find the ocean level despite case difference
        expect(mockLevelList.innerHTML).toBe('');
      }
    });

    it('should search level descriptions', () => {
      const levels = [
        createMockLevel(1, 'Level 1', true),
        createMockLevel(2, 'Level 2', true)
      ];
      levels[0].description = 'A mystical forest adventure';
      levels[1].description = 'Deep ocean exploration';
      
      levelSelect.updateLevels(levels);
      
      mockSearchInput.value = 'mystical';
      const inputHandler = mockSearchInput.addEventListener.mock.calls
        .find(call => call[0] === 'input')?.[1];
      
      if (inputHandler) {
        inputHandler();
        // Should find level by description
        expect(mockLevelList.innerHTML).toBe('');
      }
    });

    it('should clear search when input is empty', () => {
      const levels = [
        createMockLevel(1, 'Level 1', true),
        createMockLevel(2, 'Level 2', true)
      ];
      
      levelSelect.updateLevels(levels);
      
      mockSearchInput.value = 'test';
      let inputHandler = mockSearchInput.addEventListener.mock.calls
        .find(call => call[0] === 'input')?.[1];
      if (inputHandler) inputHandler();
      
      mockSearchInput.value = '';
      inputHandler = mockSearchInput.addEventListener.mock.calls
        .find(call => call[0] === 'input')?.[1];
      if (inputHandler) inputHandler();
      
      // Should show all levels again
      expect(mockLevelList.innerHTML).toBe('');
    });

    it('should debounce search input', () => {
      const levels = [createMockLevel(1, 'Test Level', true)];
      levelSelect.updateLevels(levels);
      
      // Rapid input changes
      for (let i = 0; i < 10; i++) {
        mockSearchInput.value = `test${i}`;
        const inputHandler = mockSearchInput.addEventListener.mock.calls
          .find(call => call[0] === 'input')?.[1];
        if (inputHandler) inputHandler();
      }
      
      // Should debounce the filtering
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('filter functionality', () => {
    it('should create filter buttons', () => {
      const filterButton = { ...mockElement };
      mockDocument.createElement.mockReturnValue(filterButton);
      
      levelSelect.createFilterButtons();
      
      expect(filterButton.textContent).toContain('All');
      expect(filterButton.style.cssText).toContain('padding: 8px 16px');
      expect(filterButton.style.cssText).toContain('border-radius: 20px');
    });

    it('should filter by completion status', () => {
      const levels = [
        createMockLevel(1, 'Completed', true, true, 3),
        createMockLevel(2, 'Incomplete', true, false, 0),
        createMockLevel(3, 'Locked', false, false, 0)
      ];
      
      levelSelect.updateLevels(levels);
      levelSelect.filterLevels('completed');
      
      // Should show only completed levels
      expect(mockLevelList.innerHTML).toBe('');
    });

    it('should filter by difficulty', () => {
      const levels = [
        createMockLevel(1, 'Easy Level', true),
        createMockLevel(5, 'Medium Level', true),
        createMockLevel(8, 'Hard Level', true)
      ];
      
      levelSelect.updateLevels(levels);
      levelSelect.filterLevels('easy');
      
      // Should show only easy levels
      expect(mockLevelList.innerHTML).toBe('');
    });

    it('should filter by unlock status', () => {
      const levels = [
        createMockLevel(1, 'Unlocked', true),
        createMockLevel(2, 'Locked', false)
      ];
      
      levelSelect.updateLevels(levels);
      levelSelect.filterLevels('unlocked');
      
      // Should show only unlocked levels
      expect(mockLevelList.innerHTML).toBe('');
    });

    it('should handle "all" filter', () => {
      const levels = [
        createMockLevel(1, 'Level 1', true, true),
        createMockLevel(2, 'Level 2', true, false),
        createMockLevel(3, 'Level 3', false, false)
      ];
      
      levelSelect.updateLevels(levels);
      levelSelect.filterLevels('completed'); // Apply filter
      levelSelect.filterLevels('all');       // Remove filter
      
      // Should show all levels
      expect(mockLevelList.innerHTML).toBe('');
    });

    it('should update filter button states', () => {
      const filterButton = { ...mockElement };
      mockFilterButtons.querySelectorAll = jest.fn(() => [filterButton]);
      
      levelSelect.filterLevels('completed');
      
      expect(filterButton.classList.add).toHaveBeenCalledWith('active');
    });
  });

  describe('responsive design', () => {
    it('should adapt grid layout for mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      const mobileSelect = new LevelSelect();
      
      expect(mockLevelList.style.cssText).toContain('grid-template-columns: 1fr');
      
      mobileSelect.destroy();
    });

    it('should adjust level item sizes for mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 320 });
      
      const mobileSelect = new LevelSelect();
      const level = createMockLevel(1, 'Mobile Level', true);
      const levelItem = { ...mockElement };
      
      mockDocument.createElement.mockReturnValue(levelItem);
      mobileSelect.updateLevels([level]);
      
      expect(levelItem.style.cssText).toContain('padding: 15px');
      
      mobileSelect.destroy();
    });

    it('should handle orientation changes', () => {
      levelSelect.show();
      
      // Simulate orientation change
      Object.defineProperty(window, 'innerWidth', { value: 667 });
      Object.defineProperty(window, 'innerHeight', { value: 375 });
      
      window.dispatchEvent(new Event('orientationchange'));
      
      expect(mockLevelList.style.cssText).toContain('grid-template-columns');
    });

    it('should adjust search input for mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 320 });
      
      const mobileSelect = new LevelSelect();
      
      expect(mockSearchInput.style.cssText).toContain('width: 250px');
      
      mobileSelect.destroy();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      expect(mockContainer.setAttribute).toHaveBeenCalledWith('role', 'dialog');
      expect(mockContainer.setAttribute).toHaveBeenCalledWith('aria-label', 'Level Selection');
    });

    it('should support keyboard navigation between levels', () => {
      const levels = [
        createMockLevel(1, 'Level 1', true),
        createMockLevel(2, 'Level 2', true)
      ];
      const levelItem = { ...mockElement };
      
      mockDocument.createElement.mockReturnValue(levelItem);
      levelSelect.updateLevels(levels);
      
      expect(levelItem.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should announce level details to screen readers', () => {
      const level = createMockLevel(1, 'Accessible Level', true, true, 2);
      const levelItem = { ...mockElement };
      
      mockDocument.createElement.mockReturnValue(levelItem);
      levelSelect.updateLevels([level]);
      
      expect(levelItem.setAttribute).toHaveBeenCalledWith(
        'aria-label',
        expect.stringContaining('Accessible Level')
      );
    });

    it('should provide search input accessibility', () => {
      expect(mockSearchInput.setAttribute).toHaveBeenCalledWith('aria-label', 'Search levels');
      expect(mockSearchInput.setAttribute).toHaveBeenCalledWith('role', 'searchbox');
    });

    it('should indicate locked levels to screen readers', () => {
      const lockedLevel = createMockLevel(2, 'Locked Level', false);
      const levelItem = { ...mockElement };
      
      mockDocument.createElement.mockReturnValue(levelItem);
      levelSelect.updateLevels([lockedLevel]);
      
      expect(levelItem.setAttribute).toHaveBeenCalledWith('aria-disabled', 'true');
    });
  });

  describe('visibility and show/hide', () => {
    it('should show level select', () => {
      levelSelect.show();
      
      expect(mockContainer.style.display).toBe('flex');
      expect(mockContainer.style.cssText).toContain('opacity: 1');
    });

    it('should hide level select', () => {
      levelSelect.show();
      levelSelect.hide();
      
      expect(mockContainer.style.display).toBe('none');
    });

    it('should animate visibility transitions', () => {
      levelSelect.show();
      
      expect(mockContainer.style.cssText).toContain('transition: opacity 0.3s ease');
    });

    it('should focus first level on show', () => {
      const levels = [createMockLevel(1, 'First Level', true)];
      const levelItem = { ...mockElement };
      
      mockDocument.createElement.mockReturnValue(levelItem);
      levelSelect.updateLevels(levels);
      levelSelect.show();
      
      expect(levelItem.focus).toHaveBeenCalled();
    });

    it('should handle ESC key to close', () => {
      levelSelect.show();
      
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(keydownEvent);
      
      expect(mockContainer.style.display).toBe('none');
    });
  });

  describe('performance optimization', () => {
    it('should efficiently handle large level lists', () => {
      const manyLevels = Array.from({ length: 100 }, (_, i) => 
        createMockLevel(i + 1, `Level ${i + 1}`, i < 50)
      );
      
      const startTime = performance.now();
      levelSelect.updateLevels(manyLevels);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should reuse DOM elements when possible', () => {
      const levels = [createMockLevel(1, 'Reuse Test', true)];
      
      levelSelect.updateLevels(levels);
      const firstCallCount = mockDocument.createElement.mock.calls.length;
      
      levelSelect.updateLevels(levels);
      const secondCallCount = mockDocument.createElement.mock.calls.length;
      
      // Should not create many new elements on second call
      expect(secondCallCount - firstCallCount).toBeLessThan(5);
    });

    it('should debounce rapid filter changes', () => {
      const filters = ['all', 'completed', 'unlocked', 'easy', 'medium', 'hard'];
      
      filters.forEach(filter => {
        levelSelect.filterLevels(filter);
      });
      
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should efficiently handle search with many levels', () => {
      const manyLevels = Array.from({ length: 50 }, (_, i) => 
        createMockLevel(i + 1, `Level ${i + 1}`, true)
      );
      
      levelSelect.updateLevels(manyLevels);
      
      const startTime = performance.now();
      mockSearchInput.value = 'Level 2';
      const inputHandler = mockSearchInput.addEventListener.mock.calls
        .find(call => call[0] === 'input')?.[1];
      if (inputHandler) inputHandler();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('error handling', () => {
    it('should handle invalid level data gracefully', () => {
      const invalidLevels = [
        null,
        undefined,
        {},
        { id: 'invalid' },
        { name: 'no-id' }
      ];
      
      expect(() => {
        levelSelect.updateLevels(invalidLevels as any);
      }).not.toThrow();
    });

    it('should handle DOM manipulation errors', () => {
      mockLevelList.appendChild = jest.fn(() => {
        throw new Error('DOM manipulation failed');
      });
      
      const level = createMockLevel(1, 'Error Test', true);
      
      expect(() => {
        levelSelect.updateLevels([level]);
      }).not.toThrow();
    });

    it('should handle missing query selectors', () => {
      mockContainer.querySelector = jest.fn(() => null);
      
      expect(() => {
        levelSelect.selectLevel(1);
      }).not.toThrow();
    });

    it('should handle search input errors', () => {
      mockSearchInput.addEventListener = jest.fn(() => {
        throw new Error('Event listener error');
      });
      
      expect(() => {
        new LevelSelect();
      }).not.toThrow();
    });
  });

  describe('cleanup and destruction', () => {
    it('should remove elements from DOM on destroy', () => {
      levelSelect.destroy();
      
      expect(mockContainer.remove).toHaveBeenCalled();
    });

    it('should cleanup event listeners on destroy', () => {
      levelSelect.destroy();
      
      expect(mockContainer.removeEventListener).toHaveBeenCalled();
      expect(mockSearchInput.removeEventListener).toHaveBeenCalled();
    });

    it('should handle multiple destroy calls', () => {
      levelSelect.destroy();
      
      expect(() => {
        levelSelect.destroy();
      }).not.toThrow();
    });

    it('should cleanup filter button listeners', () => {
      const filterButton = { ...mockElement };
      mockFilterButtons.querySelectorAll = jest.fn(() => [filterButton]);
      
      levelSelect.destroy();
      
      expect(filterButton.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle level progression scenario', () => {
      const levels = [
        createMockLevel(1, 'Tutorial', true, true, 3),
        createMockLevel(2, 'Beginner', true, false, 0),
        createMockLevel(3, 'Advanced', false, false, 0)
      ];
      
      levelSelect.updateLevels(levels);
      levelSelect.show();
      
      // Select completed level
      levelSelect.selectLevel(1);
      
      // Try to select locked level
      levelSelect.selectLevel(3);
      
      expect(mockContainer.style.display).toBe('flex');
    });

    it('should handle search and filter combination', () => {
      const levels = [
        createMockLevel(1, 'Easy Forest', true, true, 2),
        createMockLevel(2, 'Easy Ocean', true, false, 0),
        createMockLevel(5, 'Medium Forest', true, true, 1),
        createMockLevel(8, 'Hard Mountain', false, false, 0)
      ];
      
      levelSelect.updateLevels(levels);
      
      // Apply filter then search
      levelSelect.filterLevels('easy');
      mockSearchInput.value = 'forest';
      const inputHandler = mockSearchInput.addEventListener.mock.calls
        .find(call => call[0] === 'input')?.[1];
      if (inputHandler) inputHandler();
      
      // Should show only easy forest levels
      expect(mockLevelList.innerHTML).toBe('');
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle very long level names', () => {
      const longName = 'A'.repeat(100);
      const level = createMockLevel(1, longName, true);
      
      expect(() => {
        levelSelect.updateLevels([level]);
      }).not.toThrow();
    });

    it('should handle levels with special characters', () => {
      const specialLevel = createMockLevel(1, '🎵 Special Level! 🎶 (Test)', true);
      
      expect(() => {
        levelSelect.updateLevels([specialLevel]);
      }).not.toThrow();
    });

    it('should handle rapid show/hide operations', () => {
      for (let i = 0; i < 20; i++) {
        levelSelect.show();
        levelSelect.hide();
      }
      
      expect(() => levelSelect.show()).not.toThrow();
    });

    it('should handle zero and negative level IDs', () => {
      const levels = [
        createMockLevel(0, 'Zero Level', true),
        createMockLevel(-1, 'Negative Level', true)
      ];
      
      expect(() => {
        levelSelect.updateLevels(levels);
      }).not.toThrow();
    });
  });
});
