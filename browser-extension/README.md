# German Vocab Helper - Chrome Extension

A Chrome extension for translating German words on any webpage and adding them to your vocabulary database.

## Current Status

**Phase 6, Step 6.1** - Basic extension structure created ✓

## Installation (Development Mode)

1. **Create placeholder icons** (temporary - until we design real ones):
   - Create three simple PNG files: `icon16.png`, `icon48.png`, `icon128.png`
   - Or comment out the icon references in `manifest.json` for now

2. **Load the extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the `browser-extension/` folder
   - The extension should appear in your extensions list

3. **Verify it loaded**:
   - Check the Chrome extensions page for any errors
   - Open the browser console and look for the "German Vocab Helper" log messages

## File Structure

```
browser-extension/
├── manifest.json       # Extension configuration (Manifest V3)
├── content.js         # Runs on all web pages, detects clicks
├── background.js      # Service worker, handles API calls
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic
└── popup.css          # Popup styling
```

## Next Steps

See `DevelopmentDoc.md` for the full development roadmap.
