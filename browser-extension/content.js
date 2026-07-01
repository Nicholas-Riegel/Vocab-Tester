// Content script - runs on all web pages
// Detects clicks on German words and communicates with the popup/background script

console.log('German Vocab Helper: content script loaded');

// Listen for double-clicks on words
document.addEventListener('dblclick', (event) => {
  // Get the selected text
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (!selectedText) {
    console.log('No text selected');
    return;
  }
  
  // Extract just the word (remove punctuation, numbers, etc.)
  const word = selectedText.match(/[a-zA-ZäöüßÄÖÜ]+/)?.[0];
  
  if (!word) {
    console.log('No valid word found in selection:', selectedText);
    return;
  }
  
  console.log('Word selected:', word);
  
  // Store the selected word so the popup can access it
  chrome.storage.local.set({ selectedWord: word }, () => {
    console.log('Stored word:', word);
  });
  
  // Send message to background script to fetch translation
  chrome.runtime.sendMessage({
    action: 'translateWord',
    word: word
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
      return;
    }
    console.log('Translation response:', response);
  });
});

// Listen for messages from popup (e.g., to highlight words already in DB)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'ping') {
    sendResponse({ status: 'alive' });
  }
  return true; // Keep the message channel open for async response
});
