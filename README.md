# Productivity Hub - Chrome Extension

A comprehensive productivity tool that combines todo list management, Pomodoro timer, and clipboard history tracking in a single Chrome extension.

## Features

### 📝 Todo List Management
- **Add, Edit, Delete** todos with ease
- **Priority levels**: High, Medium, Low with color-coded indicators
- **Archive functionality** to keep completed tasks organized
- **Filtering** by priority and status
- **Smart sorting** by priority and completion status
- **Persistent storage** using Chrome's local storage

### 🍅 Pomodoro Timer
- **Customizable work/break durations**
- **Task-specific timers** - link any todo to a Pomodoro session
- **Desktop notifications** for session completion
- **Visual timer display** with clear work/break indicators
- **One-click task selection** from your todo list

### 📋 Clipboard History
- **Automatic clipboard monitoring** captures copied text from any website
- **URL tracking** - saves the source URL and page title for each copied item
- **Search functionality** to quickly find clipboard items
- **Edit and delete** clipboard entries
- **Duplicate prevention** to avoid redundant entries
- **Smart storage** keeps last 100 clipboard items

## Installation

### From Source (Development)

1. **Download the extension files** to a local directory
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer mode** (toggle in top right)
4. **Click "Load unpacked"** and select the extension directory
5. **Pin the extension** to your toolbar for easy access

### Icon Setup
The extension expects icon files in the `icons/` directory:
- `icon16.png` (16x16px)
- `icon48.png` (48x48px) 
- `icon128.png` (128x128px)

You can create simple icons or use any productivity-themed icons.

## Usage

### Getting Started
1. **Click the extension icon** in your browser toolbar
2. **Add your first todo** in the "Todos" tab
3. **Set priorities** (High/Medium/Low) for better organization
4. **Start a Pomodoro session** by clicking the Pomodoro button on any todo

### Todo Management
- **Add todos**: Type in the input field and click "Add" or press Enter
- **Set priority**: Use the dropdown to assign High, Medium, or Low priority
- **Complete todos**: Click the "Complete" button (can be undone)
- **Edit todos**: Click "Edit" and modify the text
- **Archive todos**: Keep completed tasks organized without deleting
- **Filter & sort**: Use the filter dropdown and sort button for organization

### Pomodoro Sessions
1. **Select a task**: Click "Pomodoro" on any todo or select from the Pomodoro tab
2. **Customize duration**: Adjust work and break periods as needed
3. **Start the timer**: Click "Start" to begin your focused work session
4. **Take breaks**: Timer automatically switches between work and break periods
5. **Get notified**: Desktop notifications alert you when sessions complete

### Clipboard History
- **Automatic capture**: Copy any text on any website - it's automatically saved
- **View history**: Switch to the "Clipboard" tab to see all captured items
- **Search**: Use the search box to find specific clipboard entries
- **Reuse content**: Click "Copy" to copy any saved item back to clipboard
- **Edit entries**: Modify saved clipboard content as needed
- **Source tracking**: Each item shows the URL and page title where it was copied

## Permissions

The extension requires these permissions:
- **Storage**: To save todos and clipboard history locally
- **Active Tab**: To capture clipboard content and page information
- **Clipboard Read/Write**: To monitor and manage clipboard content
- **All URLs**: To track clipboard sources across all websites
- **Background**: For continuous clipboard monitoring
- **Notifications**: For Pomodoro timer alerts

## Privacy

- **All data is stored locally** on your device using Chrome's storage API
- **No data is sent to external servers**
- **Clipboard monitoring is passive** and doesn't interfere with normal usage
- **You have full control** over all stored data with edit/delete options

## Technical Details

### File Structure
```
├── manifest.json          # Extension configuration
├── popup.html             # Main UI
├── popup.css              # Styling
├── popup.js               # Core functionality
├── background.js          # Service worker for clipboard monitoring
├── content.js             # Content script for page interaction
└── icons/                 # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Data Storage
- **Todos**: Stored as JSON array with id, text, priority, completion status, and timestamps
- **Clipboard**: Stored as JSON array with content, source URL, page title, and timestamps
- **Settings**: Timer preferences stored separately

### Browser Compatibility
- **Chrome**: Fully supported (Manifest V3)
- **Chromium-based browsers**: Should work with minor modifications
- **Other browsers**: Not supported (uses Chrome-specific APIs)

## Development

### Making Changes
1. **Edit source files** as needed
2. **Reload the extension** in `chrome://extensions/`
3. **Test functionality** across different websites
4. **Check console** for any errors or debugging information

### Adding Features
- **Todo enhancements**: Modify `TodoManager` class in `popup.js`
- **Pomodoro features**: Update `PomodoroManager` class
- **Clipboard improvements**: Enhance `ClipboardManager` class and `content.js`
- **UI changes**: Update `popup.html` and `popup.css`

## Troubleshooting

### Common Issues
- **Clipboard not capturing**: Check that clipboard permissions are granted
- **Notifications not working**: Ensure notification permissions are enabled
- **Extension not loading**: Verify all files are present and manifest is valid
- **Data not persisting**: Check Chrome storage permissions

### Debug Mode
1. Open Chrome DevTools on the extension popup
2. Check console for error messages
3. Inspect storage in Application tab
4. Monitor network activity if needed

## Future Enhancements

Potential features for future versions:
- **Data export/import** functionality
- **Cloud synchronization** options
- **Advanced filtering** and tagging for todos
- **Pomodoro statistics** and productivity insights
- **Clipboard organization** with categories
- **Dark mode** theme option
- **Keyboard shortcuts** for common actions

## License

This project is available under the MIT License. Feel free to modify and distribute as needed.

## Support

For issues, feature requests, or contributions:
1. Check the troubleshooting section above
2. Review the code for customization options
3. Test with different websites and scenarios
4. Consider browser permissions and settings

---

**Happy productivity! 🚀**
