# Chrome Extension Starter Template

This is a basic starter template for building Chrome extensions. It provides a minimal file structure and boilerplate code to get you started quickly.

## Loading the Extension

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable "Developer mode" using the toggle switch in the top right corner.
3.  Click the "Load unpacked" button.
4.  Select the directory containing this template's files.

Your extension should now be loaded and active.

## File Structure

*   `manifest.json`: The core file that defines the extension's properties, permissions, and scripts.
*   `background.js`: Handles background tasks and event listeners.
*   `content.js`: Injected into web pages to interact with their content.
*   `popup.html`: The HTML structure for the extension's popup UI.
*   `popup.js`: The JavaScript logic for the popup UI.
*   `popup.css`: (Optional) Styles for the popup UI.
*   `options.html`: The HTML structure for the extension's options page.
*   `options.js`: The JavaScript logic for the options page.
*   `options.css`: (Optional) Styles for the options page.
*   `icons/`: Directory for extension icons (16x16, 48x48, 128x128).
*   `README.md`: This file, providing information about the template.
