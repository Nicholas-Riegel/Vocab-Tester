// Background service worker - handles communication between content script and backend API

console.log('German Vocab Helper: background service worker loaded');

const BACKEND_URL = 'http://127.0.0.1:8000';

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'translateWord') {
    console.log('Translating word:', message.word);
    
    // Fetch translation from backend
    fetch(`${BACKEND_URL}/api/translate?word=${encodeURIComponent(message.word)}`)
      .then(response => response.json())
      .then(data => {
        console.log('Translation result:', data);
        
        // Store the translation result
        chrome.storage.local.set({
          translationResult: data,
          lastWord: message.word
        });
        
        sendResponse(data);
      })
      .catch(error => {
        console.error('Translation error:', error);
        sendResponse({ error: error.message });
      });
    
    return true; // Keep the message channel open for async response
  }
});

// Handle extension icon click (optional - for debugging)
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id);
});
