// Runs the script once the page has been fully loaded
chrome.tabs.onUpdated.addListener(function (tabId, info) {
    if (info.status === 'complete') {
        // console.log('Loaded');
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            run_content_script(tabs[0].id, tabs[0].url);
        });
    }
});

function run_content_script(tabId, tabURL) {
    chrome.storage.sync.get(null, function (settings) {
        settings['url'] = tabURL;
        chrome.tabs.sendMessage(tabId, settings, function (response) {
            // console.log('Message successfully received');
        });
    });
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.contentScriptQuery === 'getVerses') {
            fetch(request.url)
                .then(response => response.text())
                .then(res => sendResponse(res))
                .catch(error => {
                });
            return true;  // Will respond asynchronously.
        }
    });
