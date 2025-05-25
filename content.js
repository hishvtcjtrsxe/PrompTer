// content.js
console.log("AI Prompt Modifier content script loaded.");

let activeElement = null;

document.addEventListener('focusin', (event) => {
    if (event.target.isContentEditable || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        activeElement = event.target;
        // console.log("Active element set:", activeElement);
    }
});

document.addEventListener('focusout', (event) => {
    // Optionally clear activeElement if event.target === activeElement
    // For this implementation, we'll keep activeElement as the last focused editable field
    // This can be useful if the context menu is invoked after the element loses focus.
    // if (event.target === activeElement) {
    //   activeElement = null;
    // }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getAndModifyText") {
        let textToModify = "";
        let currentElement = activeElement; // Prioritize the tracked active element

        // 1. Use selected text if available
        if (request.selectedText && request.selectedText.trim() !== "") {
            textToModify = request.selectedText;
            // Try to find the element containing the selection
            const selection = document.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let parentElement = range.commonAncestorContainer;
                if (parentElement.nodeType === Node.TEXT_NODE) {
                    parentElement = parentElement.parentElement;
                }
                // Ensure the parentElement is an editable field or part of one
                if (parentElement && (parentElement.isContentEditable || parentElement.tagName === 'INPUT' || parentElement.tagName === 'TEXTAREA')) {
                    currentElement = parentElement;
                } else if (!currentElement && document.activeElement && (document.activeElement.isContentEditable || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                    // If selection is not in an editable field, but an editable field is active, use that.
                    currentElement = document.activeElement;
                }
            }
        }
        // 2. If no selection, try the tracked activeElement
        else if (currentElement && (currentElement.isContentEditable || currentElement.value !== undefined)) {
            textToModify = currentElement.isContentEditable ? currentElement.innerText : currentElement.value;
        }
        // 3. Fallback to document.activeElement if our tracked one isn't set or usable
        else {
            const docActiveElement = document.activeElement;
            if (docActiveElement && (docActiveElement.isContentEditable || docActiveElement.tagName === 'INPUT' || docActiveElement.tagName === 'TEXTAREA')) {
                currentElement = docActiveElement;
                textToModify = docActiveElement.isContentEditable ? docActiveElement.innerText : docActiveElement.value;
            }
        }

        if (!textToModify || textToModify.trim() === "") {
            console.log("No text selected or editable field focused.");
            sendResponse({ error: "No text selected or editable field focused." });
            return false; // No async operation, send response directly
        }

        console.log("Text to modify:", textToModify);
        console.log("Current element for modification:", currentElement);

        chrome.runtime.sendMessage({
            action: "modifyTextWithAI",
            textToModify: textToModify
                // modificationType could be passed here if needed
        }, (response) => {
            if (chrome.runtime.lastError) {
                // Handle errors like the receiving end not existing (e.g., background script error)
                console.error("Runtime error from background:", chrome.runtime.lastError.message);
                alert(`Error modifying text (runtime): ${chrome.runtime.lastError.message}`);
                sendResponse({ status: "Error", message: chrome.runtime.lastError.message });
                return;
            }

            if (response.error) {
                console.error("Error from background:", response.error);
                alert(`Error modifying text: ${response.error}`);
                sendResponse({ status: "Error", message: response.error });
            } else if (response.modifiedText) {
                if (currentElement) {
                    // If there was originally selected text and a selection object still exists
                    if (request.selectedText && document.getSelection() && document.getSelection().toString()) {
                        const selection = document.getSelection();
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            // Check if the range is still within our currentElement or if currentElement is a broader editable area
                            if (currentElement.contains(range.commonAncestorContainer)) {
                                range.deleteContents();
                                range.insertNode(document.createTextNode(response.modifiedText));
                            } else if (currentElement.isContentEditable) { // Fallback to replacing content of currentElement
                                currentElement.innerText = response.modifiedText;
                            } else if (currentElement.value !== undefined) {
                                currentElement.value = response.modifiedText;
                            }
                        }
                    } else if (currentElement.isContentEditable) {
                        currentElement.innerText = response.modifiedText;
                    } else if (currentElement.value !== undefined) { // Handles INPUT and TEXTAREA
                        currentElement.value = response.modifiedText;
                    }

                    // Dispatch input and change events to ensure web pages react to the change
                    currentElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                    currentElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

                    sendResponse({ status: "Success", newText: response.modifiedText });
                } else {
                    // Fallback: No specific element to insert into, copy to clipboard
                    navigator.clipboard.writeText(response.modifiedText)
                        .then(() => {
                            alert("Modified text copied to clipboard!");
                            sendResponse({ status: "Copied to clipboard" });
                        })
                        .catch(err => {
                            console.error("Could not copy to clipboard:", err);
                            alert("Modified text is available in console. Could not copy to clipboard.");
                            sendResponse({ status: "Error", message: "Could not copy to clipboard." });
                        });
                }
            }
        });

        return true; // Indicate that sendResponse will be called asynchronously
    }
    return false; // Default for other actions
});