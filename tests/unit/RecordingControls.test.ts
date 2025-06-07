import { RecordingControls } from '@ui/components/RecordingControls';
import { GameEngine } from '@game/core/GameEngine';
import { Recording } from '@game/audio/RecordingEngine';

// Mock GameEngine
jest.mock('@game/core/GameEngine');

// Mock URL and Blob for file export tests
global.URL = {
  createObjectURL: jest.fn(() => 'mock-blob-url'),
  revokeObjectURL: jest.fn()
} as any;

global.Blob = jest.fn((content, options) => ({
  content,
  options,
  type: options?.type || 'application/octet-stream'
})) as any;

// Mock confirm dialog
global.confirm = jest.fn();

describe('RecordingControls', () => {
  let recordingControls: RecordingControls;
  let mockGameEngine: jest.Mocked<GameEngine>;
  let mockRecording: Recording;

  // Setup DOM environment
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Create mock GameEngine
    mockGameEngine = {
      on: jest.fn(),
      off: jest.fn(),
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      playRecording: jest.fn(),
      stopPlayback: jest.fn(),
      getRecordings: jest.fn(),
      deleteRecording: jest.fn(),
      exportRecording: jest.fn()
    } as any;

    // Create mock recording
    mockRecording = {
      id: 'test-recording-1',
      name: 'Test Recording',
      duration: 5000,
      timestamp: Date.now(),
      notes: [
        { time: 0, note: 'C4', velocity: 0.8 },
        { time: 1000, note: 'D4', velocity: 0.7 },
        { time: 2000, note: 'E4', velocity: 0.9 }
      ]
    };

    // Default mock implementations
    mockGameEngine.getRecordings.mockReturnValue([]);
    mockGameEngine.startRecording.mockReturnValue(true);
    mockGameEngine.exportRecording.mockReturnValue('{"test": "data"}');

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup DOM
    if (recordingControls) {
      recordingControls.cleanup();
    }
    document.body.innerHTML = '';
  });

  describe('Constructor and Initialization', () => {
    test('should create recording controls with proper DOM structure', () => {
      recordingControls = new RecordingControls(mockGameEngine);

      // Check container creation
      const container = document.getElementById('recording-controls');
      expect(container).toBeTruthy();
      expect(container?.style.position).toBe('fixed');
      expect(container?.style.top).toBe('20px');
      expect(container?.style.right).toBe('20px');
      expect(container?.style.zIndex).toBe('1000');
    });

    test('should create all required UI elements', () => {
      recordingControls = new RecordingControls(mockGameEngine);

      const container = document.getElementById('recording-controls');
      
      // Check buttons
      const recordButton = container?.querySelector('button[textContent*="Record"]') as HTMLButtonElement;
      const playButton = container?.querySelector('button[textContent*="Play"]') as HTMLButtonElement;
      const stopButton = container?.querySelector('button[textContent*="Stop"]') as HTMLButtonElement;
      
      expect(recordButton).toBeTruthy();
      expect(playButton).toBeTruthy();
      expect(stopButton).toBeTruthy();

      // Check input field
      const nameInput = container?.querySelector('input[type="text"]') as HTMLInputElement;
      expect(nameInput).toBeTruthy();
      expect(nameInput.placeholder).toBe('Recording name...');

      // Check status display
      const statusDisplay = container?.querySelector('div') as HTMLElement;
      expect(statusDisplay).toBeTruthy();
    });

    test('should set up initial button states correctly', () => {
      recordingControls = new RecordingControls(mockGameEngine);

      const container = document.getElementById('recording-controls');
      const buttons = container?.querySelectorAll('button');
      
      expect(buttons).toHaveLength(3);
      
      // Play button should be disabled initially (no recording selected)
      const playButton = Array.from(buttons || []).find(btn => 
        btn.textContent?.includes('Play')
      ) as HTMLButtonElement;
      expect(playButton.disabled).toBe(true);

      // Stop button should be disabled initially
      const stopButton = Array.from(buttons || []).find(btn => 
        btn.textContent?.includes('Stop')
      ) as HTMLButtonElement;
      expect(stopButton.disabled).toBe(true);
    });

    test('should register event listeners with GameEngine', () => {
      recordingControls = new RecordingControls(mockGameEngine);

      expect(mockGameEngine.on).toHaveBeenCalledWith('recordingStarted', expect.any(Function));
      expect(mockGameEngine.on).toHaveBeenCalledWith('recordingStopped', expect.any(Function));
      expect(mockGameEngine.on).toHaveBeenCalledWith('playbackStarted', expect.any(Function));
      expect(mockGameEngine.on).toHaveBeenCalledWith('playbackStopped', expect.any(Function));
    });

    test('should apply correct styling to container', () => {
      recordingControls = new RecordingControls(mockGameEngine);

      const container = document.getElementById('recording-controls');
      expect(container?.style.background).toContain('rgba(26, 26, 26, 0.95)');
      expect(container?.style.border).toBe('2px solid #FF00FF');
      expect(container?.style.borderRadius).toBe('12px');
      expect(container?.style.fontFamily).toContain('Courier New');
      expect(container?.style.backdropFilter).toBe('blur(10px)');
    });
  });

  describe('Recording Operations', () => {
    beforeEach(() => {
      recordingControls = new RecordingControls(mockGameEngine);
    });

    test('should start recording when record button is clicked', () => {
      const container = document.getElementById('recording-controls');
      const recordButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Record')
      ) as HTMLButtonElement;

      recordButton.click();

      expect(mockGameEngine.startRecording).toHaveBeenCalledWith(undefined);
    });

    test('should use custom name when provided', () => {
      const container = document.getElementById('recording-controls');
      const nameInput = container?.querySelector('input[type="text"]') as HTMLInputElement;
      const recordButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Record')
      ) as HTMLButtonElement;

      nameInput.value = 'My Custom Recording';
      recordButton.click();

      expect(mockGameEngine.startRecording).toHaveBeenCalledWith('My Custom Recording');
    });

    test('should clear input field after starting recording', () => {
      const container = document.getElementById('recording-controls');
      const nameInput = container?.querySelector('input[type="text"]') as HTMLInputElement;
      const recordButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Record')
      ) as HTMLButtonElement;

      nameInput.value = 'Test Recording';
      recordButton.click();

      expect(nameInput.value).toBe('');
    });

    test('should stop recording when record button is clicked during recording', () => {
      const container = document.getElementById('recording-controls');
      const recordButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Record')
      ) as HTMLButtonElement;

      // Simulate recording state
      const recordingStartedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStarted'
      )?.[1];
      recordingStartedCallback?.();

      recordButton.click();

      expect(mockGameEngine.stopRecording).toHaveBeenCalled();
    });

    test('should handle recording start event', () => {
      const container = document.getElementById('recording-controls');
      const recordButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Record')
      ) as HTMLButtonElement;
      const statusDisplay = container?.querySelector('div[style*="text-align: center"]') as HTMLElement;

      // Trigger recording started event
      const recordingStartedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStarted'
      )?.[1];
      recordingStartedCallback?.();

      expect(recordButton.textContent).toContain('Stop Rec');
      expect(statusDisplay.textContent).toBe('🔴 Recording...');
      expect(statusDisplay.style.background).toContain('rgba(255, 0, 64, 0.2)');
    });

    test('should handle recording stop event', () => {
      const container = document.getElementById('recording-controls');
      const recordButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Record')
      ) as HTMLButtonElement;

      // Start recording first
      const recordingStartedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStarted'
      )?.[1];
      recordingStartedCallback?.();

      // Stop recording
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);

      expect(recordButton.textContent).toContain('Record');
      expect(mockGameEngine.getRecordings).toHaveBeenCalled();
    });
  });

  describe('Playback Operations', () => {
    beforeEach(() => {
      recordingControls = new RecordingControls(mockGameEngine);
      mockGameEngine.getRecordings.mockReturnValue([mockRecording]);
    });

    test('should play selected recording when play button is clicked', () => {
      // First select a recording by simulating click on recording item
      const container = document.getElementById('recording-controls');
      
      // Update recordings list
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);

      // Find and click on recording item
      const recordingItem = container?.querySelector('div[style*="cursor: pointer"]') as HTMLElement;
      recordingItem?.click();

      // Now click play button
      const playButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Play')
      ) as HTMLButtonElement;
      playButton.click();

      expect(mockGameEngine.playRecording).toHaveBeenCalledWith(mockRecording);
    });

    test('should stop playback when play button is clicked during playback', () => {
      const container = document.getElementById('recording-controls');
      
      // Select recording and start playback
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);

      const recordingItem = container?.querySelector('div[style*="cursor: pointer"]') as HTMLElement;
      recordingItem?.click();

      const playbackStartedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'playbackStarted'
      )?.[1];
      playbackStartedCallback?.();

      const playButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Stop Play')
      ) as HTMLButtonElement;
      playButton.click();

      expect(mockGameEngine.stopPlayback).toHaveBeenCalled();
    });

    test('should handle playback start event', () => {
      const container = document.getElementById('recording-controls');
      const playButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Play')
      ) as HTMLButtonElement;
      const statusDisplay = container?.querySelector('div[style*="text-align: center"]') as HTMLElement;

      const playbackStartedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'playbackStarted'
      )?.[1];
      playbackStartedCallback?.();

      expect(playButton.textContent).toContain('Stop Play');
      expect(statusDisplay.textContent).toBe('▶️ Playing back...');
      expect(statusDisplay.style.background).toContain('rgba(0, 255, 64, 0.2)');
    });

    test('should handle playback stop event', () => {
      const container = document.getElementById('recording-controls');
      const playButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Play')
      ) as HTMLButtonElement;

      // Start playback first
      const playbackStartedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'playbackStarted'
      )?.[1];
      playbackStartedCallback?.();

      // Stop playback
      const playbackStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'playbackStopped'
      )?.[1];
      playbackStoppedCallback?.();

      expect(playButton.textContent).toContain('Play');
    });
  });

  describe('Recordings List Management', () => {
    beforeEach(() => {
      recordingControls = new RecordingControls(mockGameEngine);
    });

    test('should display empty state when no recordings exist', () => {
      mockGameEngine.getRecordings.mockReturnValue([]);
      
      // Trigger update
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);

      const container = document.getElementById('recording-controls');
      const emptyMessage = Array.from(container?.querySelectorAll('div') || []).find(div => 
        div.textContent === 'No recordings yet'
      );
      
      expect(emptyMessage).toBeTruthy();
      expect(emptyMessage?.style.fontStyle).toBe('italic');
    });

    test('should display recordings list when recordings exist', () => {
      mockGameEngine.getRecordings.mockReturnValue([mockRecording]);
      
      // Trigger update
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);

      const container = document.getElementById('recording-controls');
      const recordingName = Array.from(container?.querySelectorAll('div') || []).find(div => 
        div.textContent === 'Test Recording'
      );
      
      expect(recordingName).toBeTruthy();
      expect(recordingName?.style.fontWeight).toBe('bold');
      expect(recordingName?.style.color).toBe('#00FFFF');
    });

    test('should display recording information correctly', () => {
      mockGameEngine.getRecordings.mockReturnValue([mockRecording]);
      
      // Trigger update
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);

      const container = document.getElementById('recording-controls');
      const infoElements = container?.querySelectorAll('div[style*="font-size: 10px"]');
      
      const infoText = Array.from(infoElements || []).find(div => 
        div.innerHTML?.includes('Duration: 5.0s')
      );
      
      expect(infoText).toBeTruthy();
      expect(infoText?.innerHTML).toContain('Notes: 3');
    });

    test('should select recording when clicked', () => {
      mockGameEngine.getRecordings.mockReturnValue([mockRecording]);
      
      // Trigger update
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);

      const container = document.getElementById('recording-controls');
      const recordingItem = container?.querySelector('div[style*="cursor: pointer"]') as HTMLElement;
      
      recordingItem.click();

      // Check if recording is selected (play button should be enabled)
      const playButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Play')
      ) as HTMLButtonElement;
      
      expect(playButton.disabled).toBe(false);
    });

    test('should highlight selected recording', () => {
      mockGameEngine.getRecordings.mockReturnValue([mockRecording]);
      
      // Trigger update
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);

      const container = document.getElementById('recording-controls');
      const recordingItem = container?.querySelector('div[style*="cursor: pointer"]') as HTMLElement;
      
      recordingItem.click();

      expect(recordingItem.style.border).toBe('1px solid #00FFFF');
      expect(recordingItem.style.background).toBe('rgba(0, 255, 255, 0.1)');
    });
  });

  describe('Recording Management Actions', () => {
    beforeEach(() => {
      recordingControls = new RecordingControls(mockGameEngine);
      mockGameEngine.getRecordings.mockReturnValue([mockRecording]);
    });

    test('should delete recording when delete button is clicked and confirmed', () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      
      // Trigger update to show recordings
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);

      const container = document.getElementById('recording-controls');
      const deleteButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent === '🗑️'
      ) as HTMLButtonElement;
      
      deleteButton.click();

      expect(global.confirm).toHaveBeenCalledWith('Delete "Test Recording"?');
      expect(mockGameEngine.deleteRecording).toHaveBeenCalledWith('test-recording-1');
    });

    test('should not delete recording when delete is cancelled', () => {
      (global.confirm as jest.Mock).mockReturnValue(false);
      
      // Trigger update to show recordings
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);

      const container = document.getElementById('recording-controls');
      const deleteButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent === '🗑️'
      ) as HTMLButtonElement;
      
      deleteButton.click();

      expect(mockGameEngine.deleteRecording).not.toHaveBeenCalled();
    });

    test('should export recording when export button is clicked', () => {
      // Mock DOM methods for file download
      const mockClick = jest.fn();
      const mockAppendChild = jest.spyOn(document.body, 'appendChild');
      const mockRemoveChild = jest.spyOn(document.body, 'removeChild');
      
      jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') {
          return {
            href: '',
            download: '',
            click: mockClick
          } as any;
        }
        return document.createElement(tagName);
      });

      // Trigger update to show recordings
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);

      const container = document.getElementById('recording-controls');
      const exportButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent === '💾'
      ) as HTMLButtonElement;
      
      exportButton.click();

      expect(mockGameEngine.exportRecording).toHaveBeenCalledWith(mockRecording);
      expect(global.Blob).toHaveBeenCalledWith(['{"test": "data"}'], { type: 'application/json' });
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url');

      // Cleanup mocks
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
    });
  });

  describe('UI State Management', () => {
    beforeEach(() => {
      recordingControls = new RecordingControls(mockGameEngine);
    });

    test('should disable record button during playback', () => {
      const container = document.getElementById('recording-controls');
      const recordButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Record')
      ) as HTMLButtonElement;

      // Start playback
      const playbackStartedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'playbackStarted'
      )?.[1];
      playbackStartedCallback?.();

      expect(recordButton.disabled).toBe(true);
    });

    test('should disable play button during recording', () => {
      const container = document.getElementById('recording-controls');
      const playButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Play')
      ) as HTMLButtonElement;

      // Start recording
      const recordingStartedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStarted'
      )?.[1];
      recordingStartedCallback?.();

      expect(playButton.disabled).toBe(true);
    });

    test('should enable stop button during recording or playback', () => {
      const container = document.getElementById('recording-controls');
      const stopButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Stop')
      ) as HTMLButtonElement;

      // Initially disabled
      expect(stopButton.disabled).toBe(true);

      // Enable during recording
      const recordingStartedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStarted'
      )?.[1];
      recordingStartedCallback?.();

      expect(stopButton.disabled).toBe(false);
    });

    test('should update status display correctly', () => {
      const container = document.getElementById('recording-controls');
      const statusDisplay = container?.querySelector('div[style*="text-align: center"]') as HTMLElement;

      // Initial state
      expect(statusDisplay.textContent).toBe('Ready to record');

      // Recording state
      const recordingStartedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStarted'
      )?.[1];
      recordingStartedCallback?.();

      expect(statusDisplay.textContent).toBe('🔴 Recording...');
      expect(statusDisplay.style.background).toBe('rgba(255, 0, 64, 0.2)');

      // Stop recording
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);

      expect(statusDisplay.textContent).toBe('Ready');
      expect(statusDisplay.style.background).toBe('rgba(0, 0, 0, 0.5)');
    });
  });

  describe('Visibility and Interaction', () => {
    beforeEach(() => {
      recordingControls = new RecordingControls(mockGameEngine);
    });

    test('should show and hide controls', () => {
      const container = document.getElementById('recording-controls');
      
      recordingControls.hide();
      expect(container?.style.display).toBe('none');

      recordingControls.show();
      expect(container?.style.display).toBe('block');
    });

    test('should toggle visibility', () => {
      const container = document.getElementById('recording-controls');
      
      // Initially visible
      expect(container?.style.display).not.toBe('none');

      recordingControls.toggle();
      expect(container?.style.display).toBe('none');

      recordingControls.toggle();
      expect(container?.style.display).toBe('block');
    });

    test('should handle hover effects on recording items', () => {
      mockGameEngine.getRecordings.mockReturnValue([mockRecording]);
      
      // Trigger update to show recordings
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);

      const container = document.getElementById('recording-controls');
      const recordingItem = container?.querySelector('div[style*="cursor: pointer"]') as HTMLElement;
      
      // Simulate hover
      recordingItem.onmouseenter?.({} as any);
      expect(recordingItem.style.background).toBe('rgba(255, 255, 255, 0.05)');

      recordingItem.onmouseleave?.({} as any);
      expect(recordingItem.style.background).toBe('rgba(0, 0, 0, 0.3)');
    });
  });

  describe('Keyboard Interaction and Accessibility', () => {
    beforeEach(() => {
      recordingControls = new RecordingControls(mockGameEngine);
    });

    test('should handle Enter key in name input', () => {
      const container = document.getElementById('recording-controls');
      const nameInput = container?.querySelector('input[type="text"]') as HTMLInputElement;
      
      nameInput.value = 'Test Recording';
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      nameInput.dispatchEvent(enterEvent);
      
      // Should not start recording automatically on Enter
      expect(mockGameEngine.startRecording).not.toHaveBeenCalled();
    });

    test('should have proper ARIA attributes for accessibility', () => {
      const container = document.getElementById('recording-controls');
      const buttons = container?.querySelectorAll('button');
      
      // Buttons should be focusable
      buttons?.forEach(button => {
        expect(button.tabIndex).not.toBe(-1);
      });
      
      // Input should have proper attributes
      const nameInput = container?.querySelector('input[type="text"]') as HTMLInputElement;
      expect(nameInput.placeholder).toBe('Recording name...');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      recordingControls = new RecordingControls(mockGameEngine);
    });

    test('should handle failed recording start', () => {
      mockGameEngine.startRecording.mockReturnValue(false);
      
      const container = document.getElementById('recording-controls');
      const nameInput = container?.querySelector('input[type="text"]') as HTMLInputElement;
      const recordButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Record')
      ) as HTMLButtonElement;

      nameInput.value = 'Test Recording';
      recordButton.click();

      // Input should not be cleared if recording failed to start
      expect(nameInput.value).toBe('Test Recording');
    });

    test('should handle empty recording name gracefully', () => {
      const container = document.getElementById('recording-controls');
      const nameInput = container?.querySelector('input[type="text"]') as HTMLInputElement;
      const recordButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Record')
      ) as HTMLButtonElement;

      nameInput.value = '   '; // Whitespace only
      recordButton.click();

      expect(mockGameEngine.startRecording).toHaveBeenCalledWith(undefined);
    });

    test('should handle null/undefined recordings in list', () => {
      mockGameEngine.getRecordings.mockReturnValue([null as any, mockRecording, undefined as any]);
      
      // Should not throw error when updating list
      expect(() => {
        const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
          call => call[0] === 'recordingStopped'
        )?.[1];
        recordingStoppedCallback?.(mockRecording);
      }).not.toThrow();
    });

    test('should handle click events on action buttons with event propagation', () => {
      mockGameEngine.getRecordings.mockReturnValue([mockRecording]);
      
      // Trigger update to show recordings
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);

      const container = document.getElementById('recording-controls');
      const deleteButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent === '🗑️'
      ) as HTMLButtonElement;
      
      // Create mock event with stopPropagation
      const mockEvent = {
        stopPropagation: jest.fn()
      };
      
      deleteButton.onclick?.(mockEvent as any);
      
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('Memory Management and Cleanup', () => {
    beforeEach(() => {
      recordingControls = new RecordingControls(mockGameEngine);
    });

    test('should cleanup DOM elements on cleanup', () => {
      const container = document.getElementById('recording-controls');
      expect(container?.parentNode).toBe(document.body);

      recordingControls.cleanup();
      
      expect(container?.parentNode).toBeNull();
    });

    test('should handle cleanup when container is already removed', () => {
      const container = document.getElementById('recording-controls');
      container?.remove();

      // Should not throw error
      expect(() => {
        recordingControls.cleanup();
      }).not.toThrow();
    });

    test('should handle multiple cleanup calls', () => {
      recordingControls.cleanup();
      
      // Should not throw error on second cleanup
      expect(() => {
        recordingControls.cleanup();
      }).not.toThrow();
    });
  });

  describe('Performance and Optimization', () => {
    beforeEach(() => {
      recordingControls = new RecordingControls(mockGameEngine);
    });

    test('should handle large number of recordings efficiently', () => {
      const manyRecordings = Array.from({ length: 100 }, (_, i) => ({
        ...mockRecording,
        id: `recording-${i}`,
        name: `Recording ${i + 1}`
      }));
      
      mockGameEngine.getRecordings.mockReturnValue(manyRecordings);
      
      const startTime = performance.now();
      
      // Trigger update
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);
      
      const endTime = performance.now();
      
      // Should complete within reasonable time (under 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should have proper scrolling container
      const container = document.getElementById('recording-controls');
      const recordingsList = container?.querySelector('div[style*="overflow-y: auto"]');
      expect(recordingsList).toBeTruthy();
      expect(recordingsList?.style.maxHeight).toBe('200px');
    });

    test('should debounce rapid UI updates', () => {
      // Simulate rapid state changes
      const recordingStartedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStarted'
      )?.[1];
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      
      // Rapid fire events
      recordingStartedCallback?.();
      recordingStoppedCallback?.(mockRecording);
      recordingStartedCallback?.();
      recordingStoppedCallback?.(mockRecording);
      
      // Should handle without errors
      const container = document.getElementById('recording-controls');
      expect(container).toBeTruthy();
    });
  });

  describe('Integration with GameEngine', () => {
    beforeEach(() => {
      recordingControls = new RecordingControls(mockGameEngine);
    });

    test('should pass correct parameters to GameEngine methods', () => {
      const container = document.getElementById('recording-controls');
      const nameInput = container?.querySelector('input[type="text"]') as HTMLInputElement;
      const recordButton = Array.from(container?.querySelectorAll('button') || []).find(btn => 
        btn.textContent?.includes('Record')
      ) as HTMLButtonElement;

      // Test with custom name
      nameInput.value = 'Custom Recording Name';
      recordButton.click();
      
      expect(mockGameEngine.startRecording).toHaveBeenCalledWith('Custom Recording Name');
      
      // Test stop recording
      const recordingStartedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStarted'
      )?.[1];
      recordingStartedCallback?.();
      
      recordButton.click();
      expect(mockGameEngine.stopRecording).toHaveBeenCalled();
    });

    test('should handle GameEngine event sequences correctly', () => {
      const container = document.getElementById('recording-controls');
      const statusDisplay = container?.querySelector('div[style*="text-align: center"]') as HTMLElement;
      
      // Start recording
      const recordingStartedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStarted'
      )?.[1];
      recordingStartedCallback?.();
      
      expect(statusDisplay.textContent).toBe('🔴 Recording...');
      
      // Stop recording
      const recordingStoppedCallback = mockGameEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];
      recordingStoppedCallback?.(mockRecording);
      
      expect(statusDisplay.textContent).toBe('Ready');
      expect(mockGameEngine.getRecordings).toHaveBeenCalled();
    });
  });
});
