#!/bin/bash

echo "🧹 Cleaning up Keyboard Cosmic Jam..."

# Kill any running node/vite processes
echo "Stopping any running dev servers..."
pkill -f vite 2>/dev/null || true
pkill -f "node.*dev" 2>/dev/null || true

# Clean build artifacts
echo "Removing build artifacts..."
rm -rf dist/
rm -rf .vite/

# Clear node modules cache (optional - uncomment if needed)
# echo "Clearing node modules..."
# rm -rf node_modules/
# rm -f package-lock.json

# Install dependencies (optional - uncomment if node_modules was deleted)
# echo "Installing dependencies..."
# npm install

echo "✅ Cleanup complete!"
echo ""
echo "To start the dev server:"
echo "  npm run dev"
echo ""
echo "To build for production:"
echo "  npm run build"
echo ""
echo "💡 Tip: If you still see React errors, try:"
echo "  - Clear browser cache (Ctrl+Shift+Delete)"
echo "  - Use incognito/private window"
echo "  - Try a different port: npm run dev -- --port 3000"