document.addEventListener('DOMContentLoaded', () => {
  const textToModifyEl = document.getElementById('textToModify');
  const modificationTypeEl = document.getElementById('modificationType');
  const modifyButton = document.getElementById('modifyButton');
  const modifiedTextResultEl = document.getElementById('modifiedTextResult');
  const statusMessageEl = document.getElementById('statusMessage');

  // 1. Prefill with Selected Text from the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id != null) { // Check for null or undefined tab.id
      const tabId = tabs[0].id;
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          function: () => getSelection().toString(),
        },
        (injectionResults) => {
          if (chrome.runtime.lastError) {
            console.warn(`Error executing script to get selection: ${chrome.runtime.lastError.message}`);
            // It's okay if this fails (e.g., on chrome:// pages), don't show user-facing error.
            return;
          }
          if (injectionResults && injectionResults[0] && injectionResults[0].result) {
            textToModifyEl.value = injectionResults[0].result;
          }
        }
      );
    } else {
      console.warn("Could not identify active tab to prefill selected text.");
    }
  });

  // 2. modifyButton Event Listener
  if (modifyButton) {
    modifyButton.addEventListener('click', async () => {
      const text = textToModifyEl.value;
      const type = modificationTypeEl.value;

      statusMessageEl.textContent = 'Processing...';
      modifiedTextResultEl.value = '';

      if (!text.trim()) {
        statusMessageEl.textContent = 'Please enter some text to modify.';
        return;
      }

      try {
        const response = await chrome.runtime.sendMessage({
          action: "modifyTextWithAI",
          textToModify: text,
          modificationType: type,
        });

        if (chrome.runtime.lastError) {
          // This catches issues if the background script itself has an issue before even processing the message
          console.error(`Runtime error during sendMessage: ${chrome.runtime.lastError.message}`);
          statusMessageEl.textContent = `Error: ${chrome.runtime.lastError.message}. Ensure the extension is loaded correctly.`;
          return;
        }
        
        if (response) {
          if (response.error) {
            console.error("Error from background script:", response.error);
            statusMessageEl.textContent = `Error: ${response.error}`;
          } else if (response.modifiedText != null) { // Check for null or undefined explicitly
            modifiedTextResultEl.value = response.modifiedText;
            statusMessageEl.textContent = 'Text modified successfully!';
          } else {
            console.warn("Received an unexpected response:", response);
            statusMessageEl.textContent = 'Received an unexpected response from the background service.';
          }
        } else {
          // This case might occur if background.js doesn't send a response or sendResponse is not called.
          console.error("No response received from background script.");
          statusMessageEl.textContent = 'No response received from background service. Check extension logs.';
        }

      } catch (error) {
        // This catches network errors or if sendMessage itself throws an error (e.g. extension context invalidated)
        console.error("Error sending message to background script:", error);
        statusMessageEl.textContent = `Error: ${error.message}. Ensure the extension is loaded correctly and the background service is running.`;
      }
    });
  } else {
    console.error("Modify button not found in popup.html");
  }
});
