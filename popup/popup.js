/**
 * Popup script for the GitHub PR File Viewer
 */

// Get elements from DOM
const autoCollapseCheckbox = document.getElementById('auto-collapse');
const highlightViewedCheckbox = document.getElementById('highlight-viewed');
const storageDaysSelect = document.getElementById('storage-days');
const clearDataButton = document.getElementById('clear-data-button');
const statusMessage = document.getElementById('status-message');

// Default settings
const defaultSettings = {
  autoCollapseViewed: false,
  highlightViewedFiles: true,
  keepViewedFilesFor: 7
};

// Load settings when popup is opened
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
});

// Load settings from storage
function loadSettings() {
  browser.runtime.sendMessage({
    action: 'getSettings'
  }).then(response => {
    if (response && response.success) {
      const settings = response.settings || defaultSettings;
      
      // Update UI to match settings
      autoCollapseCheckbox.checked = settings.autoCollapseViewed || defaultSettings.autoCollapseViewed;
      highlightViewedCheckbox.checked = settings.highlightViewedFiles !== undefined ? 
                                         settings.highlightViewedFiles : 
                                         defaultSettings.highlightViewedFiles;
      
      const keepDays = settings.keepViewedFilesFor || defaultSettings.keepViewedFilesFor;
      // Find the closest option or default to 7 days
      let found = false;
      for (const option of storageDaysSelect.options) {
        if (parseInt(option.value) === keepDays) {
          option.selected = true;
          found = true;
          break;
        }
      }
      if (!found) {
        storageDaysSelect.value = '7'; // Default to 7 days if exact match not found
      }
    } else {
      console.error('Failed to load settings');
      statusMessage.textContent = 'Error loading settings';
    }
  }).catch(error => {
    console.error('Error loading settings:', error);
    statusMessage.textContent = `Error: ${error.message}`;
  });
}

// Save settings when changed
function saveSettings() {
  const settings = {
    autoCollapseViewed: autoCollapseCheckbox.checked,
    highlightViewedFiles: highlightViewedCheckbox.checked,
    keepViewedFilesFor: parseInt(storageDaysSelect.value, 10)
  };
  
  browser.runtime.sendMessage({
    action: 'saveSettings',
    settings: settings
  }).then(response => {
    if (response && response.success) {
      showStatus('Settings saved');
    } else {
      showStatus('Error saving settings');
    }
  }).catch(error => {
    console.error('Error saving settings:', error);
    showStatus(`Error: ${error.message}`);
  });
}

// Clear all saved data
function clearAllData() {
  if (confirm('Are you sure you want to clear all saved data?\nThis will remove information about all viewed files.')) {
    browser.runtime.sendMessage({
      action: 'clearAllData'
    }).then(response => {
      if (response && response.success) {
        showStatus('All data cleared');
      } else {
        showStatus('Error clearing data');
      }
    }).catch(error => {
      console.error('Error clearing data:', error);
      showStatus(`Error: ${error.message}`);
    });
  }
}

// Show status message with timeout
function showStatus(message, duration = 2000) {
  statusMessage.textContent = message;
  
  setTimeout(() => {
    statusMessage.textContent = '';
  }, duration);
}

// Add event listeners
autoCollapseCheckbox.addEventListener('change', saveSettings);
highlightViewedCheckbox.addEventListener('change', saveSettings);
storageDaysSelect.addEventListener('change', saveSettings);
clearDataButton.addEventListener('click', clearAllData); 