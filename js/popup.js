document.querySelector('#reload-button').addEventListener('click', function () {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (!tabs[0].url.startsWith('about:')) {
            // eslint-disable-next-line unicorn/no-null
            chrome.storage.sync.get(null, function (settings) {
                if (settings === undefined) {
                    settings = {};
                }
                settings['url'] = tabs[0].url;
                chrome.tabs.sendMessage(tabs[0].id, settings, function () {
                    // Make the popup close after clicking on the button
                    window.close();
                });
            });
        }
    });
});
