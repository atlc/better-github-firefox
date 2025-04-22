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

/**
 * GitHub PR File Viewer
 * Adds ability to collapse previously viewed files in GitHub pull requests
 */

// Main class for the PR file viewer
class GithubPRFileViewer {
  constructor() {
    this.viewedFiles = {};
    this.prId = this.getPRId();
    this.isFilesTab = this.checkIsFilesTab();
    this.initialized = false;
  }

  // Initialize the file viewer
  async init() {
    if (!this.isFilesTab || this.initialized) return;
    
    // Load viewed files from storage
    await this.loadViewedFiles();
    
    // Add toggle buttons to file headers
    this.addFileButtons();
    
    // Add global controls
    this.addGlobalControls();
    
    // Set up mutation observer to handle dynamically loaded content
    this.setupObserver();
    
    this.initialized = true;
    console.log('GitHub PR File Viewer initialized');
  }

  // Get the PR ID from the URL
  getPRId() {
    const match = location.pathname.match(/\/pull\/(\d+)/);
    return match ? `${location.pathname.split('/').slice(1, 3).join('/')}_${match[1]}` : null;
  }

  // Check if we're on the Files tab of a PR
  checkIsFilesTab() {
    return location.pathname.includes('/pull/') && 
           (location.pathname.includes('/files') || 
            document.querySelector('.js-file') !== null);
  }

  // Load viewed files from browser storage
  async loadViewedFiles() {
    if (!this.prId) return;
    
    try {
      const result = await browser.storage.local.get(this.prId);
      this.viewedFiles = result[this.prId] || {};
      console.log('Loaded viewed files:', this.viewedFiles);
    } catch (error) {
      console.error('Error loading viewed files:', error);
    }
  }

  // Save viewed files to browser storage
  async saveViewedFiles() {
    if (!this.prId) return;
    
    try {
      await browser.storage.local.set({ [this.prId]: this.viewedFiles });
      console.log('Saved viewed files:', this.viewedFiles);
    } catch (error) {
      console.error('Error saving viewed files:', error);
    }
  }

  // Add toggle buttons to file headers
  addFileButtons() {
    const fileElements = document.querySelectorAll('.js-file');
    
    fileElements.forEach(fileEl => {
      const fileHeader = fileEl.querySelector('.file-header');
      if (!fileHeader || fileHeader.querySelector('.pr-file-viewer-collapse-button')) return;
      
      const filePath = this.getFilePath(fileEl);
      if (!filePath) return;
      
      // Create collapse button
      const collapseButton = document.createElement('button');
      collapseButton.className = 'pr-file-viewer-collapse-button';
      collapseButton.textContent = 'Collapse';
      collapseButton.addEventListener('click', () => this.toggleFile(fileEl, filePath));
      
      // Append button to file header
      const fileHeaderActions = fileHeader.querySelector('.file-actions');
      if (fileHeaderActions) {
        fileHeaderActions.prepend(collapseButton);
      }
      
      // Mark as viewed if in our list
      if (this.viewedFiles[filePath]) {
        this.markFileAsViewed(fileEl, filePath);
        
        // Collapse if setting says so
        if (this.viewedFiles[filePath].collapsed) {
          this.collapseFile(fileEl);
        }
      }
      
      // Track when file is scrolled into view
      this.observeFileVisibility(fileEl, filePath);
    });
  }

  // Get the file path from a file element
  getFilePath(fileEl) {
    const fileHeaderLink = fileEl.querySelector('.file-header a[title]');
    return fileHeaderLink ? fileHeaderLink.getAttribute('title') : null;
  }

  // Toggle file collapse state
  toggleFile(fileEl, filePath) {
    if (!fileEl.classList.contains('pr-file-viewer-collapsed')) {
      this.collapseFile(fileEl);
    } else {
      this.expandFile(fileEl);
    }
    
    // Update state
    if (this.viewedFiles[filePath]) {
      this.viewedFiles[filePath].collapsed = fileEl.classList.contains('pr-file-viewer-collapsed');
      this.saveViewedFiles();
    }
  }

  // Collapse a file
  collapseFile(fileEl) {
    fileEl.classList.add('pr-file-viewer-collapsed');
    const button = fileEl.querySelector('.pr-file-viewer-collapse-button');
    if (button) button.textContent = 'Expand';
  }

  // Expand a file
  expandFile(fileEl) {
    fileEl.classList.remove('pr-file-viewer-collapsed');
    const button = fileEl.querySelector('.pr-file-viewer-collapse-button');
    if (button) button.textContent = 'Collapse';
  }

  // Mark a file as viewed
  markFileAsViewed(fileEl, filePath) {
    fileEl.classList.add('pr-file-viewer-viewed');
    
    if (!this.viewedFiles[filePath]) {
      this.viewedFiles[filePath] = { 
        viewed: true, 
        collapsed: false,
        timestamp: Date.now()
      };
      this.saveViewedFiles();
    }
  }

  // Observe when a file becomes visible in the viewport
  observeFileVisibility(fileEl, filePath) {
    // Skip if already viewed
    if (this.viewedFiles[filePath]) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // If in view for more than 2 seconds, mark as viewed
          setTimeout(() => {
            const stillIntersecting = Array.from(document.querySelectorAll('.js-file'))
              .includes(fileEl);
            
            if (stillIntersecting && !this.viewedFiles[filePath]) {
              this.markFileAsViewed(fileEl, filePath);
            }
          }, 2000);
          
          observer.disconnect();
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(fileEl);
  }

  // Add global controls for all files
  addGlobalControls() {
    // Check if controls already exist
    if (document.querySelector('.pr-file-viewer-controls')) return;
    
    const fileContainer = document.querySelector('.js-diff-progressive-container');
    if (!fileContainer) return;
    
    // Create controls container
    const controls = document.createElement('div');
    controls.className = 'pr-file-viewer-controls';
    controls.style.margin = '10px 0';
    
    // Create expand all button
    const expandAllButton = document.createElement('button');
    expandAllButton.className = 'pr-file-viewer-toggle-all';
    expandAllButton.textContent = 'Expand All Files';
    expandAllButton.addEventListener('click', () => this.expandAllFiles());
    
    // Create collapse viewed button
    const collapseViewedButton = document.createElement('button');
    collapseViewedButton.className = 'pr-file-viewer-toggle-all';
    collapseViewedButton.textContent = 'Collapse Viewed Files';
    collapseViewedButton.addEventListener('click', () => this.collapseViewedFiles());
    
    // Create status text
    const statusText = document.createElement('span');
    statusText.className = 'pr-file-viewer-status';
    this.updateStatusText(statusText);
    
    // Add controls to the page
    controls.appendChild(expandAllButton);
    controls.appendChild(collapseViewedButton);
    controls.appendChild(statusText);
    fileContainer.parentNode.insertBefore(controls, fileContainer);
  }

  // Update the status text showing how many files have been viewed
  updateStatusText(statusElement) {
    const totalFiles = document.querySelectorAll('.js-file').length;
    const viewedCount = Object.keys(this.viewedFiles).length;
    
    if (statusElement) {
      statusElement.textContent = `${viewedCount}/${totalFiles} files viewed`;
    }
  }

  // Expand all files
  expandAllFiles() {
    const fileElements = document.querySelectorAll('.js-file');
    
    fileElements.forEach(fileEl => {
      this.expandFile(fileEl);
      
      // Update state
      const filePath = this.getFilePath(fileEl);
      if (filePath && this.viewedFiles[filePath]) {
        this.viewedFiles[filePath].collapsed = false;
      }
    });
    
    this.saveViewedFiles();
  }

  // Collapse all viewed files
  collapseViewedFiles() {
    const fileElements = document.querySelectorAll('.js-file');
    
    fileElements.forEach(fileEl => {
      const filePath = this.getFilePath(fileEl);
      
      if (filePath && this.viewedFiles[filePath]) {
        this.collapseFile(fileEl);
        this.viewedFiles[filePath].collapsed = true;
      }
    });
    
    this.saveViewedFiles();
  }

  // Set up mutation observer to handle dynamically loaded content
  setupObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.classList && (
                node.classList.contains('js-file') || 
                node.querySelector('.js-file')
              )) {
                shouldUpdate = true;
                break;
              }
            }
          }
        }
        
        if (shouldUpdate) break;
      }
      
      if (shouldUpdate) {
        this.addFileButtons();
        this.updateStatusText(document.querySelector('.pr-file-viewer-status'));
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const prFileViewer = new GithubPRFileViewer();
  prFileViewer.init();
  
  // Handle navigation within GitHub (it's a SPA)
  let lastUrl = location.href;
  
  // Check for URL changes
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      
      // Re-initialize on URL change
      setTimeout(() => {
        const newViewer = new GithubPRFileViewer();
        newViewer.init();
      }, 1000); // Small delay to ensure GitHub has updated the DOM
    }
  });
  
  observer.observe(document, { subtree: true, childList: true });
}); 