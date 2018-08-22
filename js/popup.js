document.getElementById('reload-button').addEventListener('click', function () {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.storage.sync.get(null, function (settings) {
            chrome.tabs.sendMessage(tabs[0].id, settings, function (response) {
            });
        });
    });
});