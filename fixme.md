# FIXME - Known Issues & Bugs

## Current Implementation Issues
- [ ] BackgroundEffects class needs implementation (referenced but not found)
- [ ] TouchZoneRenderer class needs implementation (referenced but not found)
- [ ] Audio files for story mode background music not yet created
- [ ] Visual themes for story levels need full implementation
- [ ] Instrument unlock system needs to be connected to UI

## Recently Fixed
- [x] Service worker error with navigation mode - Fixed by handling navigation requests separately
- [x] TypeScript type casting for objective targets in StoryMode
- [x] Removed unused sessionStartTime variable
- [x] Fixed PIXI.js TextStyle gradient fill properties
- [x] Fixed unused parameter warnings

## Performance Considerations
- [ ] Particle effects in celebrations may impact low-end devices
- [ ] Multiple simultaneous visual effects need optimization
- [ ] Score popups should be pooled to reduce GC pressure
- [ ] Achievement notification queue needs cleanup after display
- [ ] Memory management with many active visual effects

## UI/UX Improvements Needed
- [ ] Level select needs better mobile layout
- [ ] Achievement badges need touch-friendly tooltips
- [ ] Score display positioning conflicts with level progress
- [ ] Need proper menu/navigation system
- [ ] Pause menu for story mode needs implementation

## Story Mode Features to Complete
- [ ] Background music system integration
- [ ] Level-specific visual themes beyond basic settings
- [ ] Tutorial/onboarding for first-time players
- [ ] Cutscenes or intro animations for each level
- [ ] Save progress mid-level functionality

## Future Potential Issues to Watch
- Audio latency on mobile devices (especially Android)
- Touch input accuracy on small screens
- Memory management with particle effects
- Cross-browser audio compatibility
- Performance on devices with < 4GB RAM

## Common Problem Areas
### Audio
- Web Audio API context suspension on iOS
- Audio sprite timing precision
- Volume normalization across different sound banks
- Background music looping and crossfading

### Visual
- Canvas performance with many particles
- Sprite batching optimization needed
- Screen orientation handling
- PIXI.js texture memory management

### Input
- Keyboard mapping variations across layouts
- Multi-touch gesture conflicts
- Input lag on low-end devices
- Touch zone accuracy on different screen sizes

### Mobile
- PWA installation prompts
- Offline cache invalidation
- Background audio handling
- Screen wake lock during gameplay

## Testing Scenarios
- Test on minimum spec devices (2019 era)
- Verify audio continues during screen rotation
- Check memory leaks during extended play
- Validate touch zones at different resolutions
- Test story mode progression save/load
- Verify achievement unlocks persist
- Test scoring accuracy with rapid input

## Missing Features
- [ ] Sound effects for UI interactions
- [ ] Settings menu for volume/effects control
- [ ] Parent gate for external links/purchases
- [ ] Offline progress sync when reconnected
- [ ] Accessibility options (colorblind mode, reduced motion, etc.)
- [ ] Cloud save functionality
- [ ] Social sharing of achievements
- [ ] Recording export to standard audio formats