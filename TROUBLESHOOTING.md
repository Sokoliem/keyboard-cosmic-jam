# Troubleshooting Guide

## React-related 404 Errors

If you're seeing errors like:
- `main.tsx:1 Failed to load resource: the server responded with a status of 404`
- `@react-refresh:1 Failed to load resource: the server responded with a status of 404`

### Solution:

1. **Clear Browser Cache**
   - Open Developer Tools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

2. **Check for Port Conflicts**
   ```bash
   # Kill any existing dev servers
   pkill -f node
   pkill -f vite
   
   # Or on Windows:
   taskkill /F /IM node.exe
   ```

3. **Start Fresh**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   
   # Start dev server
   npm run dev
   ```

4. **Use Incognito/Private Window**
   - Open an incognito/private browser window
   - Navigate to http://localhost:5173
   - This bypasses cache and extensions

5. **Alternative Port**
   If port 5173 is in use, start on a different port:
   ```bash
   npm run dev -- --port 3000
   ```

## Common Issues

### Audio Not Playing
- Click anywhere on the page first (browser security requires user interaction)
- Check your volume settings
- Try a different browser

### Visual Effects Not Showing
- Update your graphics drivers
- Try disabling hardware acceleration in browser settings
- Check if WebGL is enabled: visit https://get.webgl.org/

### Mobile Touch Not Working
- Ensure you're accessing via HTTPS or localhost
- Check that touch events are not being blocked by browser settings
- Try rotating your device to trigger layout recalculation

### Recording Not Saving
- Check browser's localStorage quota
- Try exporting recordings to files instead
- Clear old recordings if storage is full