# GitHub PR File Viewer

A Firefox extension that improves pull request review experience on GitHub by allowing you to collapse previously viewed files, similar to Bitbucket's functionality.

## Features

- Automatically tracks which files you've viewed in a pull request
- Adds collapse/expand buttons to each file
- Option to automatically collapse files after viewing
- Global controls to expand all files or collapse all viewed files
- Shows a count of viewed vs. total files
- Persists your view state between browser sessions

## How It Works

When you're reviewing a GitHub pull request, this extension:

1. Adds a "Collapse" button to each file header
2. Tracks which files you've viewed (when you scroll through them)
3. Marks viewed files with a checkmark
4. Allows you to collapse viewed files to keep track of your progress
5. Provides toggles at the top to expand all or collapse viewed files

## Installation

### From Firefox Add-ons

*(Coming soon)*

### Manual Installation (Development)

1. Clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Navigate to the cloned repository and select `manifest.json`

## Configuration

Click the extension icon to configure:

- Auto-collapse viewed files
- Highlight viewed files
- Set how long to remember viewed files
- Clear all saved data

## Development

### Project Structure

- `manifest.json` - Extension configuration
- `background.js` - Background script for data persistence
- `content_scripts/content.js` - Main functionality that manipulates GitHub's UI
- `content_scripts/content.css` - Styles for the UI components
- `popup/` - Extension popup UI for settings

### Building for Production

To package this extension for distribution:

1. Zip all the necessary files (excluding development files like README.md, .git, etc.)
2. Submit the zip file to [Mozilla Add-ons](https://addons.mozilla.org/developers/)

## License

This project is available under the MIT License. 