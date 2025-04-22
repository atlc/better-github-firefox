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

// Debug mode - set to true to see detailed logs
const DEBUG = true;

// Helper function for debug logging
function debugLog(...args) {
  if (DEBUG) {
    console.log('[GitHub PR File Viewer]', ...args);
  }
}

// Safely add debug panel to the page
function addDebugPanel() {
  if (!DEBUG) return;
  
  // Wait for document.body to be available
  if (!document.body) {
    // Try again once the DOM content is loaded
    debugLog('document.body not available yet, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', addDebugPanel);
    return;
  }
  
  // If panel already exists, don't add again
  if (document.getElementById('pr-file-viewer-debug')) {
    return;
  }
  
  const panel = document.createElement('div');
  panel.style.position = 'fixed';
  panel.style.bottom = '10px';
  panel.style.right = '10px';
  panel.style.padding = '10px';
  panel.style.backgroundColor = 'rgba(200, 230, 255, 0.9)';
  panel.style.border = '1px solid #0366d6';
  panel.style.borderRadius = '4px';
  panel.style.zIndex = '9999';
  panel.style.fontSize = '12px';
  panel.style.maxWidth = '300px';
  panel.style.maxHeight = '200px';
  panel.style.overflow = 'auto';
  panel.style.color = '#24292e';
  panel.id = 'pr-file-viewer-debug';
  
  const title = document.createElement('h4');
  title.textContent = 'GitHub PR File Viewer Debug';
  title.style.margin = '0 0 8px 0';
  
  const status = document.createElement('div');
  status.id = 'pr-file-viewer-debug-status';
  status.textContent = 'Extension loaded, waiting for PR files...';
  
  panel.appendChild(title);
  panel.appendChild(status);
  document.body.appendChild(panel);
  
  debugLog('Debug panel added to page');
}

// Update debug panel with status
function updateDebugStatus(message) {
  if (!DEBUG) return;
  
  // Wait for document to be ready
  if (!document.body) {
    setTimeout(() => updateDebugStatus(message), 500);
    return;
  }
  
  const status = document.getElementById('pr-file-viewer-debug-status');
  if (status) {
    const timestamp = new Date().toLocaleTimeString();
    const newLine = document.createElement('div');
    newLine.textContent = `${timestamp}: ${message}`;
    status.appendChild(newLine);
    
    // Keep only last 10 messages
    while (status.childNodes.length > 10) {
      status.removeChild(status.firstChild);
    }
  }
}

// Main class for the PR file viewer
class GithubPRFileViewer {
  constructor() {
    this.viewedFiles = {};
    this.prId = this.getPRId();
    this.isFilesTab = this.checkIsFilesTab();
    this.initialized = false;
    this.lineStats = {
      totalLines: 0,
      viewedLines: 0
    };
    
    debugLog('Constructor called', { 
      prId: this.prId, 
      isFilesTab: this.isFilesTab 
    });
  }

  // Initialize the file viewer
  async init() {
    debugLog('Init called');
    
    // Make sure document.body is available
    if (!document.body) {
      debugLog('document.body not available yet, waiting for DOMContentLoaded');
      document.addEventListener('DOMContentLoaded', () => this.init());
      return;
    }
    
    // Add some delay to ensure GitHub has finished rendering
    setTimeout(async () => {
      if (!this.isFilesTab) {
        debugLog('Not on files tab, aborting initialization');
        updateDebugStatus('Not on PR files tab, extension inactive');
        return;
      }
      
      if (this.initialized) {
        debugLog('Already initialized, skipping');
        return;
      }
      
      debugLog('Initializing extension');
      updateDebugStatus('Initializing extension...');
      
      // Load viewed files from storage
      await this.loadViewedFiles();
      
      // Add an indicator element to ensure we can modify the DOM
      this.addIndicator();
      
      // Add toggle buttons to file headers
      this.addFileButtons();
      
      // Add global controls
      this.addGlobalControls();
      
      // Set up mutation observer to handle dynamically loaded content
      this.setupObserver();
      
      this.initialized = true;
      debugLog('Extension initialized successfully');
      updateDebugStatus('Extension initialized successfully');
    }, 1000);
  }

  // Add a visible indicator to show the extension is working
  addIndicator() {
    // Make sure document.body is available
    if (!document.body) {
      debugLog('document.body not available yet for indicator');
      setTimeout(() => this.addIndicator(), 500);
      return;
    }
    
    const indicator = document.createElement('div');
    indicator.id = 'pr-file-viewer-indicator';
    indicator.textContent = 'GitHub PR File Viewer Active';
    indicator.style.position = 'fixed';
    indicator.style.top = '10px';
    indicator.style.right = '10px';
    indicator.style.padding = '8px 12px';
    indicator.style.backgroundColor = '#0366d6';
    indicator.style.color = 'white';
    indicator.style.borderRadius = '4px';
    indicator.style.fontSize = '12px';
    indicator.style.fontWeight = 'bold';
    indicator.style.zIndex = '9999';
    indicator.style.opacity = '0.9';
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.opacity = '0';
        indicator.style.transition = 'opacity 0.5s';
        setTimeout(() => {
          if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
          }
        }, 500);
      }
    }, 5000);
    
    document.body.appendChild(indicator);
    debugLog('Indicator added to page');
  }

  // Get the PR ID from the URL
  getPRId() {
    const match = location.pathname.match(/\/pull\/(\d+)/);
    const prId = match ? `${location.pathname.split('/').slice(1, 3).join('/')}_${match[1]}` : null;
    debugLog('PR ID extracted', prId);
    return prId;
  }

  // Check if we're on the Files tab of a PR
  checkIsFilesTab() {
    const isPullRequest = location.pathname.includes('/pull/');
    const hasFileTab = location.pathname.includes('/files') || document.querySelector('.js-file, .file, [data-file-type]') !== null;
    
    debugLog('Files tab check', { 
      isPullRequest, 
      hasFileTab, 
      path: location.pathname,
      filesFound: document.querySelectorAll('.js-file, .file, [data-file-type]').length
    });
    
    return isPullRequest && hasFileTab;
  }

  // Load viewed files from browser storage
  async loadViewedFiles() {
    if (!this.prId) return;
    
    try {
      const result = await browser.storage.local.get(this.prId);
      this.viewedFiles = result[this.prId] || {};
      debugLog('Loaded viewed files from storage', this.viewedFiles);
    } catch (error) {
      console.error('Error loading viewed files:', error);
      updateDebugStatus(`Error: ${error.message}`);
    }
  }

  // Save viewed files to browser storage
  async saveViewedFiles() {
    if (!this.prId) return;
    
    try {
      await browser.storage.local.set({ [this.prId]: this.viewedFiles });
      debugLog('Saved viewed files to storage');
    } catch (error) {
      console.error('Error saving viewed files:', error);
      updateDebugStatus(`Error: ${error.message}`);
    }
  }

  // Add toggle buttons to file headers
  addFileButtons() {
    // GitHub sometimes uses different selectors for files
    const fileElements = document.querySelectorAll('.js-file, .file, [data-file-type]');
    
    debugLog(`Found ${fileElements.length} file elements`);
    updateDebugStatus(`Found ${fileElements.length} file elements`);
    
    fileElements.forEach((fileEl, index) => {
      const fileHeader = fileEl.querySelector('.file-header, .js-file-header, .js-details-container > .Details-content--hidden-not-important');
      
      if (!fileHeader) {
        debugLog(`No file header found for file ${index}`);
        return;
      }
      
      if (fileHeader.querySelector('.pr-file-viewer-collapse-button')) {
        debugLog(`Button already exists for file ${index}`);
        return;
      }
      
      const filePath = this.getFilePath(fileEl);
      if (!filePath) {
        debugLog(`No file path found for file ${index}`);
        return;
      }
      
      debugLog(`Adding button for file: ${filePath}`);
      
      // Create collapse button
      const collapseButton = document.createElement('button');
      collapseButton.className = 'pr-file-viewer-collapse-button';
      collapseButton.textContent = 'Collapse';
      collapseButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleFile(fileEl, filePath);
      });
      
      // Try different places to append the button
      const fileHeaderActions = fileHeader.querySelector(
        '.file-actions, .js-file-header-actions, .d-flex'
      );
      
      if (fileHeaderActions) {
        fileHeaderActions.prepend(collapseButton);
        debugLog(`Button added to file actions for ${filePath}`);
      } else {
        // If no actions container found, append to the header itself
        fileHeader.appendChild(collapseButton);
        debugLog(`Button added directly to header for ${filePath}`);
      }
      
      // Count lines in this file
      const lineCount = this.countLinesInFile(fileEl);
      if (lineCount > 0) {
        this.lineStats.totalLines += lineCount;
      }
      
      // Mark as viewed if in our list
      if (this.viewedFiles[filePath]) {
        this.markFileAsViewed(fileEl, filePath, lineCount);
        
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
    // Try multiple selectors for the file path
    const fileHeaderLink = fileEl.querySelector(
      '.file-header a[title], .js-file-header a[title], [data-path], a[data-file-type]'
    );
    
    if (fileHeaderLink) {
      // Try different attributes to get the path
      const path = fileHeaderLink.getAttribute('title') || 
                   fileHeaderLink.getAttribute('data-path') || 
                   fileHeaderLink.textContent.trim();
                   
      debugLog('Found file path:', path);
      return path;
    }
    
    // Fallback method - try to find any text content that looks like a path
    const possiblePathElements = fileEl.querySelectorAll('a, span, div');
    for (const el of possiblePathElements) {
      const text = el.textContent.trim();
      // If it contains a slash and doesn't have HTML tags inside
      if (text.includes('/') && !/<[^>]*>/g.test(text)) {
        debugLog('Found path using fallback method:', text);
        return text;
      }
    }
    
    debugLog('No file path found');
    return null;
  }

  // Toggle file collapse state
  toggleFile(fileEl, filePath) {
    debugLog(`Toggling file: ${filePath}`);
    
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
    debugLog('Collapsing file');
    fileEl.classList.add('pr-file-viewer-collapsed');
    const button = fileEl.querySelector('.pr-file-viewer-collapse-button');
    if (button) button.textContent = 'Expand';
  }

  // Expand a file
  expandFile(fileEl) {
    debugLog('Expanding file');
    fileEl.classList.remove('pr-file-viewer-collapsed');
    const button = fileEl.querySelector('.pr-file-viewer-collapse-button');
    if (button) button.textContent = 'Collapse';
  }

  // Count lines of code in a file element
  countLinesInFile(fileEl) {
    // Look for line numbers in the file
    const lineNumbers = fileEl.querySelectorAll('.js-line-number, .blob-num');
    if (lineNumbers && lineNumbers.length > 0) {
      // Get the last line number
      const lastLineEl = lineNumbers[lineNumbers.length - 1];
      const lineText = lastLineEl.textContent.trim();
      const lineNum = parseInt(lineText, 10);
      
      if (!isNaN(lineNum) && lineNum > 0) {
        return lineNum;
      }
    }
    
    // Fallback to counting diff lines
    const diffLines = fileEl.querySelectorAll('.js-file-line, .blob-code');
    return diffLines.length;
  }

  // Mark a file as viewed
  markFileAsViewed(fileEl, filePath, lineCount = 0) {
    debugLog(`Marking file as viewed: ${filePath}`);
    fileEl.classList.add('pr-file-viewer-viewed');
    
    if (!this.viewedFiles[filePath]) {
      // If line count wasn't provided, try to count now
      if (lineCount <= 0) {
        lineCount = this.countLinesInFile(fileEl);
      }
      
      this.viewedFiles[filePath] = { 
        viewed: true, 
        collapsed: false,
        timestamp: Date.now(),
        lineCount: lineCount
      };
      
      // Update viewed lines count
      this.lineStats.viewedLines += lineCount;
      
      this.saveViewedFiles();
    }
  }

  // Observe when a file becomes visible in the viewport
  observeFileVisibility(fileEl, filePath) {
    // Skip if already viewed
    if (this.viewedFiles[filePath]) return;
    
    try {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            debugLog(`File now visible in viewport: ${filePath}`);
            
            // If in view for more than 2 seconds, mark as viewed
            setTimeout(() => {
              const stillIntersecting = Array.from(document.querySelectorAll('.js-file, .file, [data-file-type]'))
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
    } catch (error) {
      console.error('Error setting up intersection observer:', error);
    }
  }

  // Add global controls for all files
  addGlobalControls() {
    // Check if controls already exist
    if (document.querySelector('.pr-file-viewer-controls')) {
      debugLog('Global controls already exist');
      return;
    }
    
    // Look for different possible containers
    const fileContainer = document.querySelector(
      '.js-diff-progressive-container, .diff-view, .js-diff-view'
    );
    
    if (!fileContainer) {
      debugLog('Could not find file container for global controls');
      updateDebugStatus('Error: File container not found');
      return;
    }
    
    debugLog('Adding global controls');
    
    // Create controls container
    const controls = document.createElement('div');
    controls.className = 'pr-file-viewer-controls';
    controls.style.margin = '10px 0';
    controls.style.display = 'flex';
    controls.style.flexWrap = 'wrap';
    controls.style.gap = '8px';
    controls.style.alignItems = 'center';
    controls.style.padding = '10px';
    controls.style.backgroundColor = '#f6f8fa';
    controls.style.border = '1px solid #e1e4e8';
    controls.style.borderRadius = '6px';
    
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
    
    // Create view all button
    const viewAllButton = document.createElement('button');
    viewAllButton.className = 'pr-file-viewer-toggle-all';
    viewAllButton.textContent = 'Mark All as Viewed';
    viewAllButton.addEventListener('click', () => this.markAllAsViewed());
    
    // Create unview all button
    const unviewAllButton = document.createElement('button');
    unviewAllButton.className = 'pr-file-viewer-toggle-all';
    unviewAllButton.textContent = 'Mark All as Unviewed';
    unviewAllButton.addEventListener('click', () => this.markAllAsUnviewed());
    
    // Create status text
    const statusText = document.createElement('span');
    statusText.className = 'pr-file-viewer-status';
    this.updateStatusText(statusText);
    
    // Add controls to the page
    controls.appendChild(expandAllButton);
    controls.appendChild(collapseViewedButton);
    controls.appendChild(viewAllButton);
    controls.appendChild(unviewAllButton);
    controls.appendChild(statusText);
    
    // Try to insert at the beginning of the file container
    fileContainer.insertBefore(controls, fileContainer.firstChild);
    
    debugLog('Global controls added');
    updateDebugStatus('Added global controls');
  }

  // Update the status text showing how many files have been viewed
  updateStatusText(statusElement) {
    if (!statusElement) return;
    
    const totalFiles = document.querySelectorAll('.js-file, .file, [data-file-type]').length;
    const viewedCount = Object.keys(this.viewedFiles).length;
    
    // Calculate percentage of files viewed
    const filePercentage = totalFiles > 0 ? Math.round((viewedCount / totalFiles) * 100) : 0;
    
    // Calculate percentage of lines viewed
    const linePercentage = this.lineStats.totalLines > 0 
      ? Math.round((this.lineStats.viewedLines / this.lineStats.totalLines) * 100) 
      : 0;
    
    statusElement.textContent = `${viewedCount}/${totalFiles} files viewed (${filePercentage}%) • ${linePercentage}% of code reviewed`;
    debugLog(`Status updated: ${viewedCount}/${totalFiles} files viewed (${filePercentage}%), ${linePercentage}% of code reviewed`);
  }

  // Expand all files
  expandAllFiles() {
    debugLog('Expanding all files');
    
    const fileElements = document.querySelectorAll('.js-file, .file, [data-file-type]');
    
    fileElements.forEach(fileEl => {
      this.expandFile(fileEl);
      
      // Update state
      const filePath = this.getFilePath(fileEl);
      if (filePath && this.viewedFiles[filePath]) {
        this.viewedFiles[filePath].collapsed = false;
      }
    });
    
    this.saveViewedFiles();
    updateDebugStatus('Expanded all files');
  }

  // Collapse all viewed files
  collapseViewedFiles() {
    debugLog('Collapsing viewed files');
    
    const fileElements = document.querySelectorAll('.js-file, .file, [data-file-type]');
    let collapsedCount = 0;
    
    fileElements.forEach(fileEl => {
      const filePath = this.getFilePath(fileEl);
      
      if (filePath && this.viewedFiles[filePath]) {
        this.collapseFile(fileEl);
        this.viewedFiles[filePath].collapsed = true;
        collapsedCount++;
      }
    });
    
    this.saveViewedFiles();
    updateDebugStatus(`Collapsed ${collapsedCount} viewed files`);
  }

  // Mark all files as viewed
  markAllAsViewed() {
    debugLog('Marking all files as viewed');
    
    const fileElements = document.querySelectorAll('.js-file, .file, [data-file-type]');
    let viewedCount = 0;
    
    // Reset viewed lines count before marking all
    this.lineStats.viewedLines = 0;
    
    fileElements.forEach(fileEl => {
      const filePath = this.getFilePath(fileEl);
      if (!filePath) return;
      
      // Count lines in this file
      const lineCount = this.countLinesInFile(fileEl);
      
      // Add viewed class
      fileEl.classList.add('pr-file-viewer-viewed');
      
      // Update viewedFiles object
      if (!this.viewedFiles[filePath]) {
        this.viewedFiles[filePath] = {
          viewed: true,
          collapsed: false,
          timestamp: Date.now(),
          lineCount: lineCount
        };
        
        // Update viewed lines count
        this.lineStats.viewedLines += lineCount;
        
        viewedCount++;
      }
    });
    
    // Save to storage
    this.saveViewedFiles();
    
    // Update status text
    this.updateStatusText(document.querySelector('.pr-file-viewer-status'));
    updateDebugStatus(`Marked ${viewedCount} files as viewed`);
  }
  
  // Mark all files as unviewed
  markAllAsUnviewed() {
    debugLog('Marking all files as unviewed');
    
    const fileElements = document.querySelectorAll('.js-file, .file, [data-file-type]');
    
    // Remove viewed class from all files
    fileElements.forEach(fileEl => {
      fileEl.classList.remove('pr-file-viewer-viewed');
      fileEl.classList.remove('pr-file-viewer-collapsed');
      
      // Update button text if needed
      const button = fileEl.querySelector('.pr-file-viewer-collapse-button');
      if (button) button.textContent = 'Collapse';
    });
    
    // Clear viewedFiles object for this PR
    this.viewedFiles = {};
    
    // Reset viewed lines count
    this.lineStats.viewedLines = 0;
    
    // Save to storage
    this.saveViewedFiles();
    
    // Update status text
    this.updateStatusText(document.querySelector('.pr-file-viewer-status'));
    updateDebugStatus('Marked all files as unviewed');
  }

  // Set up mutation observer to handle dynamically loaded content
  setupObserver() {
    try {
      const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.classList && (
                  node.classList.contains('js-file') || 
                  node.classList.contains('file') ||
                  node.querySelector('.js-file, .file, [data-file-type]')
                )) {
                  shouldUpdate = true;
                  debugLog('New file content detected via mutation observer');
                  break;
                }
              }
            }
          }
          
          if (shouldUpdate) break;
        }
        
        if (shouldUpdate) {
          debugLog('Updating due to DOM changes');
          this.addFileButtons();
          this.updateStatusText(document.querySelector('.pr-file-viewer-status'));
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      debugLog('Mutation observer set up');
    } catch (error) {
      console.error('Error setting up mutation observer:', error);
    }
  }
}

// Initialize when the page loads
function initExtension() {
  debugLog('Extension script loaded');
  
  // Wait for document to be ready for debug panel
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addDebugPanel();
      startExtension();
    });
  } else {
    addDebugPanel();
    startExtension();
  }
}

// Start the extension after ensuring DOM is available
function startExtension() {
  // Create and initialize the PR file viewer
  const prFileViewer = new GithubPRFileViewer();
  prFileViewer.init();
  
  // Handle navigation within GitHub (it's a SPA)
  let lastUrl = location.href;
  
  // Check for URL changes
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      debugLog('URL changed from', lastUrl, 'to', location.href);
      lastUrl = location.href;
      
      // Re-initialize on URL change
      setTimeout(() => {
        debugLog('Reinitializing after URL change');
        updateDebugStatus('URL changed, reinitializing...');
        const newViewer = new GithubPRFileViewer();
        newViewer.init();
      }, 1000); // Small delay to ensure GitHub has updated the DOM
    }
  });
  
  observer.observe(document, { subtree: true, childList: true });
}

// Better initialization strategy
if (document.readyState === 'loading') {
  debugLog('Document still loading, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', initExtension);
} else {
  debugLog('Document already loaded, initializing now');
  initExtension();
}

// Also run on window load as a fallback
window.addEventListener('load', () => {
  debugLog('Window load event triggered');
  // Only initialize if not already initialized
  if (!document.getElementById('pr-file-viewer-debug')) {
    initExtension();
  }
}); 