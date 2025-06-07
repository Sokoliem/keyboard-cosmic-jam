# Keyboard Cosmic Jam 🎹🚀

An 80s-themed musical keyboard game for kids ages 3-6 that transforms your computer keyboard into a magical synthesizer!

## 🎮 Features

- **Instant Musical Fun**: Every key press creates delightful sounds and vibrant visuals
- **Story Mode**: Guided musical adventures with friendly characters
- **Sandbox Mode**: Free-play creativity with multiple instruments
- **Touch Support**: Works on tablets and phones too!
- **80s Aesthetic**: Neon colors, geometric shapes, and synth sounds

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with Web Audio API support

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/keyboard-cosmic-jam.git
cd keyboard-cosmic-jam

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to play!

### Mobile Development
```bash
# Start with mobile debugging enabled
npm run dev:mobile
```

## 📁 Project Structure

```
src/
├── game/          # Core game logic
│   ├── core/      # Game engine, input handling
│   ├── audio/     # Sound synthesis and music
│   ├── visuals/   # Graphics and animations
│   └── modes/     # Game modes (story, sandbox)
├── ui/            # User interface components
└── utils/         # Shared utilities
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm run test         # Run tests
```

### Key Technologies

- **Vite** - Lightning-fast build tool
- **TypeScript** - Type-safe development
- **PixiJS** - Hardware-accelerated graphics
- **Tone.js** - Web Audio synthesis
- **GSAP** - Smooth animations

## 🎨 Design Philosophy

1. **Instant Gratification**: Every action produces immediate feedback
2. **No Failure States**: Only positive reinforcement
3. **Visual-First**: No reading required
4. **Age-Appropriate**: 5-15 minute play sessions

## 📱 Platform Support

- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ✅ Tablets (iPad, Android tablets)
- ✅ Mobile phones (landscape recommended)
- ✅ PWA support for offline play

## 🤝 Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

## 📄 License

ISC License - see LICENSE file for details

## 🎵 Credits

Created with love for young musicians everywhere! 

Special thanks to the open-source audio and gaming communities.