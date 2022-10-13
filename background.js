// background.js

chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['content.js']
    });
    chrome.tabs.sendMessage(tab.id, {message: "toggle-tab"}, function(isActive) {
        setIcon(tab.id, isActive);
    });

});

// Set the right icon in the given tab id, depending on that tab's active state.
function setIcon(tabId, isActive) {

    const path = isActive ? "images/sp-col-16x16.png" : "images/sp-bw-16x16.png";
    chrome.action.setIcon({
        path, tabId
    });
}
