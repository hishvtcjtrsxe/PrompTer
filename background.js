// background.js

async function modifyPromptWithAI(text, modificationType) {
  try {
    const data = await chrome.storage.sync.get("apiKey");
    if (!data.apiKey) {
      console.error("Error: AI API Key not set.");
      return "Error: AI API Key not set.";
    }
    // const apiKey = data.apiKey; // Store for actual API call

    // Placeholder AI Call with simulated delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return `Modified: ${text} [using ${modificationType}]`;

  } catch (error) {
    console.error("Error in modifyPromptWithAI:", error);
    return `Error: ${error.message}`;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "modifyPromptAI",
    title: "Modify with AI",
    contexts: ["selection", "editable"]
  });
  console.log("AI Prompt Modifier context menu created.");
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "modifyPromptAI") {
    if (tab && tab.id !== undefined) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: "getAndModifyText",
          selectedText: info.selectionText
        });
      } catch (error) {
        console.error("Error sending message to content script:", error);
        // Handle cases where the content script might not be ready or injected
        if (error.message.includes("Receiving end does not exist")) {
          console.warn("Content script not available in the target tab or page.");
        }
      }
    } else {
      console.error("Error: Tab ID is undefined. Cannot send message to content script.");
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "modifyTextWithAI") {
    const { textToModify, modificationType } = request;
    modifyPromptWithAI(textToModify, modificationType)
      .then(modifiedText => {
        sendResponse({ modifiedText: modifiedText });
      })
      .catch(error => {
        // Ensure error is a string or has a message property
        const errorMessage = error instanceof Error ? error.message : String(error);
        sendResponse({ error: errorMessage });
      });
    return true; // Indicate asynchronous response
  }
  return false; // For any other actions
});
