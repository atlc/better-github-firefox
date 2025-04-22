/**
 * Options script for the Firefox addon
 */

// Get elements from DOM
const optionsForm = document.getElementById('options-form');
const themeSelect = document.getElementById('theme-select');
const notificationsCheckbox = document.getElementById('notifications-checkbox');
const refreshInterval = document.getElementById('refresh-interval');
const customCss = document.getElementById('custom-css');
const saveButton = document.getElementById('save-button');
const resetButton = document.getElementById('reset-button');
const statusMessage = document.getElementById('status-message');

// Default options
const defaultOptions = {
  theme: 'light',
  enableNotifications: true,
  refreshInterval: 60,
  customCss: ''
};

// Save options to storage
function saveOptions(e) {
  e.preventDefault();
  
  const options = {
    theme: themeSelect.value,
    enableNotifications: notificationsCheckbox.checked,
    refreshInterval: parseInt(refreshInterval.value, 10),
    customCss: customCss.value
  };
  
  browser.storage.local.set(options).then(() => {
    statusMessage.textContent = 'Options saved.';
    setTimeout(() => {
      statusMessage.textContent = '';
    }, 2000);
  }).catch(error => {
    statusMessage.textContent = `Error: ${error.message}`;
  });
}

// Load saved options from storage
function loadOptions() {
  browser.storage.local.get(defaultOptions).then(options => {
    themeSelect.value = options.theme;
    notificationsCheckbox.checked = options.enableNotifications;
    refreshInterval.value = options.refreshInterval;
    customCss.value = options.customCss;
  }).catch(error => {
    console.error('Error loading options:', error);
  });
}

// Reset options to defaults
function resetOptions() {
  themeSelect.value = defaultOptions.theme;
  notificationsCheckbox.checked = defaultOptions.enableNotifications;
  refreshInterval.value = defaultOptions.refreshInterval;
  customCss.value = defaultOptions.customCss;
  
  statusMessage.textContent = 'Options reset to defaults. Click Save to apply.';
}

// Add event listeners
document.addEventListener('DOMContentLoaded', loadOptions);
optionsForm.addEventListener('submit', saveOptions);
resetButton.addEventListener('click', resetOptions); 