/**
 * Popup script for the Firefox addon
 */

// Get elements from DOM
const actionButton = document.getElementById('action-button');
const statusMessage = document.getElementById('status-message');
const featureSwitch = document.getElementById('feature-switch');
const optionsLink = document.getElementById('options-link');

// Listen for button click
actionButton.addEventListener('click', () => {
  statusMessage.textContent = 'Action in progress...';
  
  // Send a message to the background script
  browser.runtime.sendMessage({
    action: 'getData'
  }).then(response => {
    if (response && response.success) {
      statusMessage.textContent = `Success: ${response.data}`;
    } else {
      statusMessage.textContent = 'Error: Invalid response';
    }
  }).catch(error => {
    statusMessage.textContent = `Error: ${error.message}`;
    console.error(error);
  });
});

// Initialize feature toggle
browser.storage.local.get('enableFeature').then(result => {
  featureSwitch.checked = result.enableFeature !== undefined ? result.enableFeature : true;
});

// Save feature toggle state
featureSwitch.addEventListener('change', () => {
  browser.storage.local.set({
    enableFeature: featureSwitch.checked
  }).then(() => {
    statusMessage.textContent = 'Settings saved';
    setTimeout(() => {
      statusMessage.textContent = '';
    }, 1500);
  });
});

// Open options page
optionsLink.addEventListener('click', event => {
  event.preventDefault();
  browser.runtime.openOptionsPage();
}); 