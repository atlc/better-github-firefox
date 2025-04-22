/**
 * Content script for Firefox addon
 * This script is injected into web pages matching the patterns in manifest.json
 */

// Function to initialize the content script
function init() {
  console.log('Content script initialized');
  
  // Example: Send a message to the background script
  browser.runtime.sendMessage({
    action: 'contentScriptLoaded',
    url: window.location.href
  }).then(response => {
    console.log('Response from background:', response);
  }).catch(error => {
    console.error('Error sending message:', error);
  });
}

// Example of modifying page content
function modifyPage() {
  // This is just an example - modify as needed for your addon
  const elements = document.querySelectorAll('h1, h2, h3');
  
  elements.forEach(el => {
    // Add a class to these elements for styling
    el.classList.add('firefox-addon-styled');
  });
}

// Run initialization
init();

// Add event listener for page load complete
window.addEventListener('load', () => {
  modifyPage();
}); 