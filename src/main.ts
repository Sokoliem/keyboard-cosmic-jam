import './ui/styles/global.css';
import { GameEngine } from './game/core/GameEngine';
import { AudioEngine } from './game/audio/AudioEngine';
import { VisualEngine } from './game/visuals/VisualEngine';
import { InputManager } from './game/core/InputManager';
import { RecordingEngine } from './game/audio/RecordingEngine';
import { RecordingControls } from './ui/components/RecordingControls';
import { KeyboardOverlay } from './ui/components/KeyboardOverlay';
import { WelcomeScreen } from './ui/components/WelcomeScreen';
import { ToddlerMode } from './ui/components/ToddlerMode';
import { initializeApp } from './ui/App';

// Service Worker registration - disabled in development
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}

// In development, unregister any existing service workers
if ('serviceWorker' in navigator && import.meta.env.DEV) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('Unregistered service worker in development mode');
    }
  });
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Remove loading screen
    const loadingElement = document.querySelector('.loading');
    
    // Initialize core systems
    const audioEngine = new AudioEngine();
    const visualEngine = new VisualEngine();
    const inputManager = new InputManager();
    const recordingEngine = new RecordingEngine();
    
    // Create game engine with all systems
    const gameEngine = new GameEngine({
      audioEngine,
      visualEngine,
      inputManager,
      recordingEngine
    });
    
    // Initialize UI
    await initializeApp(gameEngine);
    
    // Start the game
    await gameEngine.start();
    
    // Initialize recording controls UI
    const recordingControls = new RecordingControls(gameEngine);
    
    // Initialize keyboard overlay
    const keyboardOverlay = new KeyboardOverlay();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      // Toggle recording controls with Ctrl+R
      if (event.key.toLowerCase() === 'r' && event.ctrlKey) {
        event.preventDefault();
        recordingControls.toggle();
        return;
      }
      
      // Toggle keyboard overlay with K key
      if (event.key.toLowerCase() === 'k' && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        keyboardOverlay.toggle();
        return;
      }
      
      // Show welcome screen with Ctrl+W (for debugging)
      if (event.key.toLowerCase() === 'w' && event.ctrlKey) {
        event.preventDefault();
        welcomeScreen.show();
        return;
      }
    });
    
    // Initialize toddler mode
    const toddlerMode = new ToddlerMode();
    
    // Show welcome screen for first-time users
    const welcomeScreen = new WelcomeScreen();
    if (WelcomeScreen.shouldShow()) {
      welcomeScreen.show();
    }
    
    // Listen for game start request
    document.addEventListener('gameStartRequested', () => {
      console.log('🎵 Welcome! Start making music by pressing any keys on your keyboard!');
      
      // Ensure audio context is ready (required for Web Audio API)
      if (audioEngine && typeof audioEngine.initialize === 'function') {
        audioEngine.initialize().catch(console.error);
      }
    });
    
    // Listen for toddler mode request
    document.addEventListener('toddlerModeRequested', async () => {
      console.log('👶 Activating Toddler Mode...');
      
      try {
        // Ensure audio context is ready
        if (audioEngine && typeof audioEngine.initialize === 'function') {
          await audioEngine.initialize();
        }
        
        // Activate toddler mode
        await toddlerMode.activateToddlerMode();
        
        console.log('🔒 Toddler Mode active! Your child can safely use the entire keyboard.');
      } catch (error) {
        console.error('Failed to activate toddler mode:', error);
      }
    });
    
    // Fade out loading screen
    if (loadingElement) {
      loadingElement.classList.add('fade-out');
      setTimeout(() => loadingElement.remove(), 500);
    }
    
    console.log('🎹 Keyboard Cosmic Jam initialized with recording studio!');
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
});