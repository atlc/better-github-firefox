# Firefox Addon Template

This is a template scaffold for developing Firefox browser extensions.

## Structure

- `manifest.json` - The main configuration file for the addon
- `background.js` - Background script that runs continually
- `content_scripts/` - Scripts that are injected into web pages
  - `content.js` - Basic content script
- `popup/` - Browser action popup UI
  - `popup.html` - Popup HTML
  - `popup.css` - Popup styling
  - `popup.js` - Popup functionality
- `options/` - Options page
  - `options.html` - Options page HTML
  - `options.css` - Options page styling
  - `options.js` - Options page functionality
- `icons/` - Icon files for the addon

## Development

### Prerequisites

- Firefox browser
- Basic knowledge of HTML, CSS, and JavaScript

### Testing the Addon

1. Open Firefox
2. Navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Navigate to your addon directory and select `manifest.json`

The addon will now be loaded temporarily in your browser.

### Debugging

- You can view any `console.log` output in the browser console (F12)
- For background script debugging, go to `about:debugging`, find your extension, and click "Inspect"

## Building for Production

To package your addon for distribution:

1. Zip all the files (excluding any development files like README.md, .git, etc.)
2. Submit the zip file to [Mozilla Add-ons](https://addons.mozilla.org/developers/)

## Resources

- [Mozilla Add-ons Developer Hub](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons)
- [Browser Extensions Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Firefox Add-on Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/)

## License

This template is available under the MIT License. 