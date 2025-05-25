document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const defaultModelInput = document.getElementById('defaultModel');
    const saveButton = document.getElementById('saveOptionsButton');
    const statusEl = document.getElementById('status');

    // Load Saved Options
    chrome.storage.sync.get(['apiKey', 'defaultModel'], (items) => {
        if (chrome.runtime.lastError) {
            console.error("Error loading options:", chrome.runtime.lastError.message);
            statusEl.textContent = `Error loading options: ${chrome.runtime.lastError.message}`;
            statusEl.style.color = 'red';
            return;
        }
        if (items.apiKey) {
            apiKeyInput.value = items.apiKey;
        }
        if (items.defaultModel) {
            defaultModelInput.value = items.defaultModel;
        }
    });

    // Save Options
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const apiKey = apiKeyInput.value.trim();
            const defaultModel = defaultModelInput.value.trim();

            if (!apiKey) {
                statusEl.textContent = 'Error: API Key cannot be empty.';
                statusEl.style.color = 'red';
                setTimeout(() => {
                    statusEl.textContent = '';
                }, 3000);
                return;
            }

            chrome.storage.sync.set({ apiKey: apiKey, defaultModel: defaultModel }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Error saving options:", chrome.runtime.lastError.message);
                    statusEl.textContent = `Error saving options: ${chrome.runtime.lastError.message}`;
                    statusEl.style.color = 'red';
                } else {
                    statusEl.textContent = 'Options saved!';
                    statusEl.style.color = 'green';
                }
                setTimeout(() => {
                    statusEl.textContent = '';
                }, 3000);
            });
        });
    } else {
        console.error("Save button not found in options.html");
    }
});