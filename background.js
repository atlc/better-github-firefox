/**
 * Background script for the Firefox addon
 * This runs in the background and can interact with browser APIs
 */

// Add event listeners when the addon is installed
browser.runtime.onInstalled.addListener(() => {
  console.log('Addon installed');
  
  // Initialize default storage values if needed
  browser.storage.local.set({
    enableFeature: true,
    theme: 'light'
  });
});

// Listen for messages from content scripts or popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  if (message.action === 'getData') {
    // Example of returning data
    sendResponse({ success: true, data: 'Sample data' });
  }
  
  // Return true to indicate async response
  return true;
}); 