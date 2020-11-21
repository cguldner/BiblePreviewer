const BIBLE_API_KEY = '5b84d02c13d0f6135804a4aafc5f4040';

// Runs the script once the page has been fully loaded
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
    console.info(tab);
    if (info.status === 'complete') {
        // console.log('Loaded');
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            chrome.storage.sync.get(null, settings => {
                settings['url'] = tabs[0].url;
                chrome.tabs.sendMessage(tabs[0].id, settings, response => {
                    console.info(response);
                });
            });
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.contentScriptQuery === 'getVerses') {
        fetch(request.url, {
            headers: new Headers({
                'api-key': BIBLE_API_KEY,
            }),
        })
            .then(response => response.text())
            .then(res => sendResponse(res))
            .catch(error => {
                console.log(error);
            });
        return true; // Will respond asynchronously.
    }
});
