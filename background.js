chrome.runtime.onInstalled.addListener(() => {
    console.log("Exit Liquidity Shield - Installed!");
  });
  
  chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  });
  