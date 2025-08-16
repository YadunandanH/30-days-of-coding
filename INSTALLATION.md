# Quick Installation Guide

## Step 1: Create Icons
1. Open `create_icons.html` in your browser
2. Download all three icon files (icon16.png, icon48.png, icon128.png)
3. Place them in the `icons/` folder

## Step 2: Install Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the entire extension folder
5. The extension should now appear in your extensions list

## Step 3: Grant Permissions
When you first use the extension, Chrome will ask for permissions:
- **Storage**: To save your todos and clipboard history
- **Clipboard**: To monitor and manage copied text
- **Notifications**: For Pomodoro timer alerts
- **All URLs**: To track where you copy text from

## Step 4: Pin to Toolbar
1. Click the puzzle piece icon in Chrome's toolbar
2. Find "Productivity Hub" and click the pin icon
3. The extension icon will now be visible in your toolbar

## Step 5: Start Using
1. Click the extension icon to open the popup
2. Add your first todo in the "Todos" tab
3. Try copying some text on any website to test clipboard functionality
4. Start a Pomodoro session for focused work

## Troubleshooting
- If icons don't appear, make sure they're named correctly and in the `icons/` folder
- If clipboard doesn't work, check that permissions were granted
- If notifications don't appear, enable them in Chrome settings
- Reload the extension in `chrome://extensions/` if you make any changes

## File Structure Check
Make sure your folder contains:
```
📁 Extension Folder/
├── 📄 manifest.json
├── 📄 popup.html
├── 📄 popup.css
├── 📄 popup.js
├── 📄 background.js
├── 📄 content.js
├── 📄 README.md
└── 📁 icons/
    ├── 🖼️ icon16.png
    ├── 🖼️ icon48.png
    └── 🖼️ icon128.png
```

Ready to boost your productivity! 🚀