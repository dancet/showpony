// background.js

// execute the content script
chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['content.js']
    });
});

// toggle the badge on the chrome extension icon
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.iconText === "on") {
            chrome.action.setBadgeText({
                tabId: sender.tab.id, 
                text: "on"});
        } else {
            chrome.action.setBadgeText({
                tabId: sender.tab.id, 
                text: ""});
        }
    }
);
