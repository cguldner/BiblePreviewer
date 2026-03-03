document.querySelector('#reload-button').addEventListener('click', function () {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        const tab = tabs[0];
        const supportedUrl = tab && tab.url && /^(?:https?|file):/i.test(tab.url);
        if (supportedUrl) {
            chrome.storage.sync.get(null, function (settings) {
                if (settings === undefined) {
                    settings = {};
                }
                settings['url'] = tab.url;
                chrome.tabs.sendMessage(tab.id, settings, function () {
                    // Make the popup close after clicking on the button
                    window.close();
                });
            });
        }
    });
});
