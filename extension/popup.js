document.addEventListener("DOMContentLoaded", async () => {
    const userIdInput = document.getElementById("userId");
    const activeToggle = document.getElementById("activeToggle");
    const statusDot = document.getElementById("statusDot");
    const statusText = document.getElementById("statusText");
    const saveBtn = document.getElementById("saveBtn");

    // Load initial state
    const data = await chrome.storage.local.get(["userId", "isExtensionActive"]);
    if (data.userId) userIdInput.value = data.userId;
    if (data.isExtensionActive !== undefined) activeToggle.checked = data.isExtensionActive;

    updateUI(data.isExtensionActive && data.userId);

    saveBtn.addEventListener("click", async () => {
        const userId = userIdInput.value.trim();
        const isExtensionActive = activeToggle.checked;

        await chrome.storage.local.set({ userId, isExtensionActive });
        
        updateUI(isExtensionActive && userId);
        
        // Visual feedback
        saveBtn.textContent = "SAVED!";
        saveBtn.style.background = "#10b981";
        setTimeout(() => {
            saveBtn.textContent = "SAVE SETTINGS";
            saveBtn.style.background = "";
        }, 2000);

        // Notify background script
        chrome.runtime.sendMessage({ type: "START_POLLING" });
    });

    function updateUI(isConnected) {
        if (!statusDot || !statusText) return;
        if (isConnected) {
            statusDot.style.background = "#10b981";
            statusText.textContent = "CONNECTED & ACTIVE";
            statusText.style.color = "#10b981";
        } else {
            statusDot.style.background = "#ef4444";
            statusText.textContent = "DISCONNECTED / INACTIVE";
            statusText.style.color = "#ef4444";
        }
    }
});
