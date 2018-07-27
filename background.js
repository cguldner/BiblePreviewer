chrome.tabs.onUpdated.addListener(function (tabId, info) {
    if (info.status === 'complete') {
        console.log('Loaded');
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {loaded: true}, function (response) {
                console.log('Message successfully received');
            });
        });
    }
});

