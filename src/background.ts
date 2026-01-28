chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-extension") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_ENABLED" });
      }
    });
  }
});