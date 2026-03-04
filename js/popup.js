const BIBLE_API_BASE_URL = 'https://api.scripture.api.bible/v1/';
const BIBLE_API_KEY = process.env.BIBLE_API_KEY;

const DEFAULT_TRANS = '9879dbb7cfe39e4d-04';
const DEFAULT_LANGUAGE = 'eng';

const versionSelect = document.querySelector('#bible-version');
const languageSelect = document.querySelector('#language');
const status = document.querySelector('#save-status');

/**
 * Verify that the response is good from the fetch call
 * @param {Response} response The response object
 * @returns {object} The JSON associated with the response
 * @throws Error if response is bad
 */
function checkFetchOkResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
    }
    return response.json();
}

/**
 * Show temporary save status
 * @param {string} message Message to show
 */
function updateStatus(message) {
    status.textContent = message;
    setTimeout(function () {
        status.textContent = '';
    }, 1500);
}

/**
 * Saves options to chrome.storage
 */
function saveOptions() {
    chrome.storage.sync.set({
        'language': languageSelect.options[languageSelect.selectedIndex].value,
        'translation': versionSelect.options[versionSelect.selectedIndex].value
    }, function () {
        updateStatus('Selection saved.');
    });
}

/**
 * Populate the version selector
 * @param {object[]} versions The available bible versions
 */
function populateVersionSelect(versions) {
    versionSelect.options.length = 0;
    for (const version of versions) {
        if (version.name !== '') {
            let fullName = version.name;
            if (version.description) {
                fullName += ` - ${version.description}`;
            }
            versionSelect.add(new Option(fullName, version.id));
        }
    }
}

/**
 * Get the available bible versions based on the selected language
 * @param {Function} callback Function to call once the versions have been obtained
 */
function getVersions(callback) {
    fetch(`${BIBLE_API_BASE_URL}bibles?language=${languageSelect.options[languageSelect.selectedIndex].value}`, {
        headers: new Headers({
            'api-key': BIBLE_API_KEY,
        }),
    })
        .then(checkFetchOkResponse)
        .then(response => {
            populateVersionSelect(response.data);
            versionSelect.removeAttribute('disabled');
            callback();
        })
        .catch(error => {
            console.error(error);
        });
}

/**
 * Gets the available bible languages
 * @param {Function} callback Function to call once the languages have been fetched
 */
function getLanguages(callback) {
    fetch(`${BIBLE_API_BASE_URL}bibles`, {
        headers: new Headers({
            'api-key': BIBLE_API_KEY,
        }),
    })
        .then(checkFetchOkResponse)
        .then(response => {
            const separator = ':::';
            const versions = response.data.map(function (items) {
                return `${items.language.name}${separator}${items.language.id}`;
            });
            for (const version of [...new Set(versions)].sort()) {
                const [name, id] = version.split(separator);
                if (id !== 'eng') {
                    languageSelect.add(new Option(name, id));
                }
            }
            callback();
        })
        .catch(error => {
            console.error(error);
        });
}

/**
 * Restores select box state using the preferences stored in chrome.storage.
 * @param {Function} callback Function to call after the options are loaded
 */
function restoreOptions(callback) {
    chrome.storage.sync.get({
        'language': DEFAULT_LANGUAGE,
        'translation': DEFAULT_TRANS
    }, function (settings) {
        callback(settings);
    });
}

document.querySelector('#reload-button').addEventListener('click', function () {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        const tab = tabs[0];
        const supportedUrl = tab && tab.url && /^(?:https?|file):/i.test(tab.url);
        if (supportedUrl) {
            chrome.storage.sync.get(null, function (settings) {
                if (settings === undefined) {
                    settings = {};
                }
                settings.url = tab.url;
                chrome.tabs.sendMessage(tab.id, settings, function () {
                    window.close();
                });
            });
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    restoreOptions(function (settings) {
        getLanguages(function () {
            languageSelect.value = settings.language;
            getVersions(function () {
                versionSelect.value = settings.translation;
            });
        });
    });

    languageSelect.addEventListener('change', function () {
        getVersions(function () {
            saveOptions();
        });
    });

    versionSelect.addEventListener('change', saveOptions);
});
