chrome.tabs.onUpdated.addListener(function (tabId, info) {
    if (info.status === 'complete') {
        console.log('Loaded');
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.storage.sync.get(["translation"], function (settings) {
                chrome.tabs.sendMessage(tabs[0].id, settings, function (response) {
                    console.log('Message successfully received');
                });
            });
        });
    }
});