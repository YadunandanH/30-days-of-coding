// Content script for capturing clipboard events and selected text
(function() {
    'use strict';
    
    let lastSelectedText = '';
    let isMonitoring = true;
    
    // Monitor copy events
    document.addEventListener('copy', function(event) {
        if (!isMonitoring) return;
        
        try {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (selectedText && selectedText.length > 0) {
                // Send copied text to background script
                chrome.runtime.sendMessage({
                    action: 'addClipboardItem',
                    content: selectedText,
                    url: window.location.href,
                    title: document.title
                }).catch(error => {
                    console.log('Failed to send clipboard data:', error);
                });
                
                lastSelectedText = selectedText;
            }
        } catch (error) {
            console.log('Copy event handler error:', error);
        }
    });
    
    // Monitor text selection changes
    document.addEventListener('selectionchange', function() {
        if (!isMonitoring) return;
        
        try {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            // Store current selection for potential copying
            if (selectedText && selectedText !== lastSelectedText) {
                lastSelectedText = selectedText;
            }
        } catch (error) {
            console.log('Selection change error:', error);
        }
    });
    
    // Monitor keyboard shortcuts for copy (Ctrl+C, Cmd+C)
    document.addEventListener('keydown', function(event) {
        if (!isMonitoring) return;
        
        // Check for copy keyboard shortcut
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
            setTimeout(() => {
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();
                
                if (selectedText && selectedText.length > 0) {
                    chrome.runtime.sendMessage({
                        action: 'addClipboardItem',
                        content: selectedText,
                        url: window.location.href,
                        title: document.title
                    }).catch(error => {
                        console.log('Failed to send clipboard data:', error);
                    });
                }
            }, 100); // Small delay to ensure copy operation completes
        }
    });
    
    // Function to get current clipboard content (called from background script)
    window.getClipboardContent = function() {
        try {
            const selection = window.getSelection();
            if (selection && selection.toString().trim()) {
                return selection.toString().trim();
            }
            return null;
        } catch (error) {
            return null;
        }
    };
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getSelectedText') {
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : '';
            sendResponse({ selectedText: selectedText });
            return true;
        }
        
        if (request.action === 'toggleMonitoring') {
            isMonitoring = request.enabled;
            sendResponse({ success: true });
            return true;
        }
    });
    
    // Enhanced clipboard monitoring for various copy methods
    
    // Monitor right-click context menu copy
    document.addEventListener('contextmenu', function(event) {
        if (!isMonitoring) return;
        
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            // Store selection for potential copy via context menu
            setTimeout(() => {
                navigator.clipboard.readText().then(clipboardText => {
                    if (clipboardText && clipboardText.trim() === selection.toString().trim()) {
                        chrome.runtime.sendMessage({
                            action: 'addClipboardItem',
                            content: clipboardText.trim(),
                            url: window.location.href,
                            title: document.title
                        }).catch(error => {
                            console.log('Failed to send clipboard data:', error);
                        });
                    }
                }).catch(error => {
                    // Clipboard read permission not granted
                    console.log('Clipboard read failed:', error);
                });
            }, 500); // Delay to allow context menu copy to complete
        }
    });
    
    // Monitor input field changes that might affect clipboard
    document.addEventListener('input', function(event) {
        if (!isMonitoring) return;
        
        const target = event.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
            // Monitor for potential copy operations in input fields
            const value = target.value;
            if (target.selectionStart !== target.selectionEnd) {
                const selectedText = value.substring(target.selectionStart, target.selectionEnd);
                if (selectedText && selectedText.trim()) {
                    lastSelectedText = selectedText.trim();
                }
            }
        }
    });
    
    // Enhanced copy detection for programmatic copies
    const originalWriteText = navigator.clipboard.writeText;
    if (originalWriteText) {
        navigator.clipboard.writeText = function(text) {
            if (isMonitoring && text && text.trim()) {
                chrome.runtime.sendMessage({
                    action: 'addClipboardItem',
                    content: text.trim(),
                    url: window.location.href,
                    title: document.title
                }).catch(error => {
                    console.log('Failed to send clipboard data:', error);
                });
            }
            return originalWriteText.call(this, text);
        };
    }
    
    // Monitor for changes in clipboard content periodically
    let lastKnownClipboard = '';
    
    function checkClipboardChanges() {
        if (!isMonitoring) return;
        
        navigator.clipboard.readText().then(clipboardText => {
            if (clipboardText && 
                clipboardText.trim() !== lastKnownClipboard && 
                clipboardText.trim().length > 0) {
                
                lastKnownClipboard = clipboardText.trim();
                
                chrome.runtime.sendMessage({
                    action: 'addClipboardItem',
                    content: clipboardText.trim(),
                    url: window.location.href,
                    title: document.title
                }).catch(error => {
                    console.log('Failed to send clipboard data:', error);
                });
            }
        }).catch(error => {
            // Clipboard read permission not granted or other error
            // This is expected and normal
        });
    }
    
    // Check clipboard changes every 3 seconds
    setInterval(checkClipboardChanges, 3000);
    
    console.log('Productivity Hub content script loaded');
})();