// Background script for clipboard monitoring and URL tracking
let clipboardData = [];
let lastClipboardContent = '';

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
    console.log('Productivity Hub installed');
    
    // Set up periodic clipboard checking
    setUpClipboardMonitoring();
});

// Set up clipboard monitoring
function setUpClipboardMonitoring() {
    // Check clipboard every 2 seconds when extension is active
    setInterval(async () => {
        try {
            await checkClipboard();
        } catch (error) {
            console.log('Clipboard check failed:', error);
        }
    }, 2000);
}

// Check clipboard content
async function checkClipboard() {
    try {
        // Get active tab information
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];
        
        if (!activeTab) return;
        
        // Execute content script to get clipboard content
        const results = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            function: getClipboardContent
        });
        
        if (results && results[0] && results[0].result) {
            const clipboardContent = results[0].result;
            
            // Check if content has changed
            if (clipboardContent && clipboardContent !== lastClipboardContent) {
                lastClipboardContent = clipboardContent;
                
                // Add to clipboard data with URL and title
                const clipboardItem = {
                    content: clipboardContent,
                    url: activeTab.url,
                    title: activeTab.title,
                    timestamp: new Date().toISOString()
                };
                
                // Avoid duplicates
                const exists = clipboardData.some(item => 
                    item.content === clipboardItem.content && item.url === clipboardItem.url
                );
                
                if (!exists) {
                    clipboardData.unshift(clipboardItem);
                    
                    // Keep only last 100 items
                    clipboardData = clipboardData.slice(0, 100);
                    
                    // Save to storage
                    await chrome.storage.local.set({ clipboard: clipboardData });
                    
                    console.log('New clipboard item saved:', clipboardContent.substring(0, 50) + '...');
                }
            }
        }
    } catch (error) {
        // Silently handle errors (like when we can't access certain pages)
        console.log('Clipboard monitoring error:', error);
    }
}

// Function to be injected into content script
function getClipboardContent() {
    try {
        // Check if there's selected text
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            return selection.toString().trim();
        }
        
        // Try to read from clipboard (requires user permission)
        return navigator.clipboard.readText().then(text => {
            return text.trim();
        }).catch(() => {
            return null;
        });
    } catch (error) {
        return null;
    }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getClipboardData') {
        sendResponse({ items: clipboardData });
        return true;
    }
    
    if (request.action === 'addClipboardItem') {
        const item = {
            content: request.content,
            url: request.url || '',
            title: request.title || '',
            timestamp: new Date().toISOString()
        };
        
        // Avoid duplicates
        const exists = clipboardData.some(existing => 
            existing.content === item.content && existing.url === item.url
        );
        
        if (!exists) {
            clipboardData.unshift(item);
            clipboardData = clipboardData.slice(0, 100);
            chrome.storage.local.set({ clipboard: clipboardData });
        }
        
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === 'clearClipboard') {
        clipboardData = [];
        chrome.storage.local.set({ clipboard: clipboardData });
        sendResponse({ success: true });
        return true;
    }
});

// Load existing clipboard data on startup
chrome.storage.local.get(['clipboard'], (result) => {
    if (result.clipboard) {
        clipboardData = result.clipboard;
    }
});

// Handle tab updates to capture copy events
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        // Inject content script for clipboard monitoring
        try {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            }).catch(error => {
                // Silently handle injection failures
                console.log('Content script injection failed:', error);
            });
        } catch (error) {
            console.log('Script injection error:', error);
        }
    }
});

// Notification handlers for Pomodoro timer
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showNotification') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Productivity Hub',
            message: request.message
        });
        sendResponse({ success: true });
        return true;
    }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
    console.log('Background script started');
    setUpClipboardMonitoring();
});

// Handle alarm for periodic tasks
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'clipboardCheck') {
        checkClipboard();
    }
});

// Set up periodic alarm
chrome.alarms.create('clipboardCheck', { periodInMinutes: 0.1 }); // Check every 6 seconds