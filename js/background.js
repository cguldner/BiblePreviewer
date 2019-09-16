const BIBLE_API_KEY = 'omci89GV7FQlNgTIzDULkB16SyEuOr27xC49GEex';

// Runs the script once the page has been fully loaded
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
    if (info.status === 'complete') {
        // console.log('Loaded');
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            chrome.storage.sync.get(null, settings => {
                settings['url'] = tabs[0].url;
                chrome.tabs.sendMessage(tabs[0].id, settings, response => {
                });
            });
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.contentScriptQuery === 'getVerses') {
        fetch(request.url, {
            headers: new Headers({
                'Authorization': 'Basic ' + btoa(`${BIBLE_API_KEY}:X`),
            }),
        })
            .then(response => response.text())
            .then(res => sendResponse(res))
            .catch(error => {
            });
        return true;  // Will respond asynchronously.
    }
});
