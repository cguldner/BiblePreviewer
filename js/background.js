// Runs the script once the page has been fully loaded
chrome.tabs.onUpdated.addListener(function (tabId, info) {
    if (info.status === 'complete') {
        // console.log('Loaded');
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            run_content_script(tabs[0].id);
        });
    }
});

function run_content_script(tabId) {
    chrome.storage.sync.get(null, function (settings) {
        chrome.tabs.sendMessage(tabId, settings, function (response) {
            // console.log('Message successfully received');
        });
    });
}
