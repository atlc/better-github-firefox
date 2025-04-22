/**
 * Background script for the GitHub PR File Viewer addon
 */

// Set up default settings on install
browser.runtime.onInstalled.addListener(() => {
  console.log('GitHub PR File Viewer installed');
  
  // Initialize default settings
  browser.storage.local.set({
    settings: {
      autoCollapseViewed: false,
      keepViewedFilesFor: 7, // days
      highlightViewedFiles: true
    }
  });
  
  // Schedule cleanup of old viewed files data
  scheduleCleanup();
});

// Schedule periodic cleanup of old PR data
function scheduleCleanup() {
  browser.alarms.create('cleanup', {
    periodInMinutes: 1440 // Once per day
  });
}

// Listen for the cleanup alarm
browser.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'cleanup') {
    cleanupOldData();
  }
});

// Clean up old PR data
async function cleanupOldData() {
  try {
    // Get all stored data
    const storage = await browser.storage.local.get(null);
    
    // Get settings
    const settings = storage.settings || {};
    const keepDays = settings.keepViewedFilesFor || 7;
    const cutoffTime = Date.now() - (keepDays * 24 * 60 * 60 * 1000);
    
    // Find keys to remove
    const keysToRemove = [];
    
    // Look for PR data (not settings)
    for (const key in storage) {
      if (key === 'settings') continue;
      
      const prData = storage[key];
      let hasRecentFiles = false;
      
      // Check if any files in this PR were viewed recently
      for (const filePath in prData) {
        if (prData[filePath].timestamp && prData[filePath].timestamp > cutoffTime) {
          hasRecentFiles = true;
          break;
        }
      }
      
      // If all files in this PR are older than the cutoff, remove the entire PR
      if (!hasRecentFiles) {
        keysToRemove.push(key);
      }
    }
    
    // Remove old data
    if (keysToRemove.length > 0) {
      console.log(`Cleaning up ${keysToRemove.length} old PRs`);
      await browser.storage.local.remove(keysToRemove);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Listen for messages from popup or content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  if (message.action === 'getSettings') {
    // Return settings
    browser.storage.local.get('settings').then(result => {
      sendResponse({ 
        success: true, 
        settings: result.settings || {} 
      });
    }).catch(error => {
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    });
    
    return true; // Required for async response
  }
  
  else if (message.action === 'saveSettings') {
    // Save settings
    browser.storage.local.set({
      settings: message.settings
    }).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    });
    
    return true; // Required for async response
  }
  
  else if (message.action === 'clearAllData') {
    // Clear all saved data (except settings)
    browser.storage.local.get(null).then(result => {
      const keysToRemove = Object.keys(result).filter(key => key !== 'settings');
      return browser.storage.local.remove(keysToRemove);
    }).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    });
    
    return true; // Required for async response
  }
}); 