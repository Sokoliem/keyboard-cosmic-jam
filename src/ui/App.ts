import { GameEngine } from '@game/core/GameEngine';
import { ScoreDisplay } from './components/ScoreDisplay';
import { AchievementDisplay } from './components/AchievementDisplay';
import { LevelSelect } from './components/LevelSelect';
import { LevelProgressDisplay } from './components/LevelProgress';
import { UnlockNotification } from './components/UnlockNotification';
import { InstrumentSelector } from './components/InstrumentSelector';

export async function initializeApp(gameEngine: GameEngine): Promise<void> {
  // Initialize score display
  const scoreDisplay = new ScoreDisplay();
  
  // Listen for score updates
  gameEngine.on('scoreUpdated', (scoreState) => {
    scoreDisplay.update(scoreState);
  });
  
  // Listen for combo breaks
  gameEngine.on('comboBreak', (previousCombo) => {
    scoreDisplay.showComboBreak(previousCombo);
  });
  
  // Initialize achievement display
  const achievementDisplay = new AchievementDisplay();
  const achievementSystem = gameEngine.getAchievementSystem();
  
  // Initial achievement display
  achievementDisplay.updateAchievements(achievementSystem.getAchievements());
  achievementDisplay.updateProgress(achievementSystem.getTotalProgress());
  
  // Listen for achievement unlocks
  gameEngine.on('achievementUnlocked', (achievement) => {
    achievementDisplay.showUnlockNotification(achievement);
    achievementDisplay.updateAchievements(achievementSystem.getAchievements());
    achievementDisplay.updateProgress(achievementSystem.getTotalProgress());
  });
  
  // Add keyboard shortcut to toggle achievement display
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      achievementDisplay.toggleVisibility();
    }
  });
  
  // Initialize level select
  const levelSelect = new LevelSelect(gameEngine);
  
  // Initialize level progress display
  const levelProgress = new LevelProgressDisplay();
  
  // Listen for story mode events
  gameEngine.on('storyLevelStarted', (level) => {
    levelProgress.setLevel(level);
    scoreDisplay.show();
  });
  
  gameEngine.on('storyProgressUpdated', ({ level, progress }) => {
    levelProgress.updateProgress(level, progress);
  });
  
  gameEngine.on('storyLevelCompleted', ({ stars }) => {
    levelProgress.showCompletion(stars);
    scoreDisplay.hide();
  });
  
  // Custom events for UI navigation
  document.addEventListener('levelPause', () => {
    gameEngine.endStoryLevel();
    levelProgress.hide();
    levelSelect.show();
  });
  
  document.addEventListener('returnToLevelSelect', () => {
    levelSelect.show();
  });
  
  // Add keyboard shortcut for level select (temporary for testing)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      if (levelSelect.isOpen()) {
        levelSelect.hide();
        gameEngine.getState().setMode('sandbox');
      } else {
        levelSelect.show();
      }
    }
  });
  
  // Initialize unlock notifications
  const unlockNotification = new UnlockNotification();
  
  // Listen for unlock events
  gameEngine.on('itemUnlocked', (notification) => {
    unlockNotification.show(notification);
  });
  
  // Initialize instrument selector
  const instrumentSelector = new InstrumentSelector(gameEngine);
  
  // Show instrument selector briefly on start
  setTimeout(() => {
    instrumentSelector.show();
    setTimeout(() => {
      instrumentSelector.hide();
    }, 3000);
  }, 1000);
  
  // Start in sandbox mode
  gameEngine.getState().setMode('sandbox');
  
  console.log('UI initialized with scoring, achievements, story mode, and progression');
  console.log('Controls: Ctrl+L = Level Select | Tab = Achievements | I = Instruments');
}