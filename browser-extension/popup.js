// Popup script - manages the UI when the extension icon is clicked

console.log('German Vocab Helper: popup script loaded');

const BACKEND_URL = 'http://127.0.0.1:8000';

// Load the translation when popup opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['translationResult', 'lastWord'], (data) => {
    if (data.translationResult && data.lastWord) {
      displayTranslation(data.translationResult, data.lastWord);
    }
  });
  
  // Set up the "Add to Vocab" button
  document.getElementById('add-vocab-btn').addEventListener('click', handleAddToVocab);
});

function displayTranslation(result, word) {
  const container = document.getElementById('translation-container');
  const wordDisplay = document.getElementById('word-display');
  const translationDisplay = document.getElementById('translation-display');
  
  if (result.found) {
    // Word exists in database
    let wordText = result.word;
    if (result.article) {
      wordText = `${result.article} ${result.word}`;
    }
    wordDisplay.textContent = wordText;
    
    let translationText = result.english;
    if (result.word_type) {
      translationText += ` (${result.word_type})`;
    }
    if (result.forms) {
      translationText += `\nForms: ${result.forms}`;
    }
    if (result.plural) {
      translationText += `\nPlural: ${result.plural}`;
    }
    translationDisplay.textContent = translationText;
    
    // Hide the "Add to Vocab" button since it's already in the database
    document.getElementById('add-vocab-btn').style.display = 'none';
  } else {
    // Word not found - show option to add it
    wordDisplay.textContent = word;
    translationDisplay.textContent = 'Not in database yet. Translation coming soon...';
    document.getElementById('add-vocab-btn').style.display = 'block';
    document.getElementById('add-vocab-btn').disabled = true; // Disable until we have translation service
  }
  
  container.style.display = 'block';
}

function handleAddToVocab() {
  chrome.storage.local.get(['lastWord', 'translationResult'], (data) => {
    // TODO: This will be implemented when we add the translation service
    console.log('Add to vocab clicked for:', data.lastWord);
    alert('Translation service not yet implemented. Coming in the next step!');
  });
}
