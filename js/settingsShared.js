const BIBLE_API_BASE_URL = 'https://api.scripture.api.bible/v1/';

const DEFAULT_TRANS = '9879dbb7cfe39e4d-04';
const DEFAULT_LANGUAGE = 'eng';

/**
 * Verify that the response is good from the fetch call.
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
 * Fetch available bible languages.
 * @param {string} apiKey The bible API key
 * @returns {Promise<object[]>} List of language entries with name and id
 */
function fetchLanguages(apiKey) {
    return fetch(`${BIBLE_API_BASE_URL}bibles`, {
        headers: new Headers({
            'api-key': apiKey,
        }),
    })
        .then(checkFetchOkResponse)
        .then(response => {
            const separator = ':::';
            const versions = response.data.map(function (items) {
                return `${items.language.name}${separator}${items.language.id}`;
            });
            return [...new Set(versions)]
                .sort()
                .map(version => {
                    const [name, id] = version.split(separator);
                    return {name, id};
                })
                .filter(language => language.id !== 'eng');
        });
}

/**
 * Fetch available bible versions for a language.
 * @param {string} apiKey The bible API key
 * @param {string} languageId The selected language id
 * @returns {Promise<object[]>} List of bible versions
 */
function fetchVersions(apiKey, languageId) {
    return fetch(`${BIBLE_API_BASE_URL}bibles?language=${languageId}`, {
        headers: new Headers({
            'api-key': apiKey,
        }),
    })
        .then(checkFetchOkResponse)
        .then(response => response.data);
}

/**
 * Add language options to a select element.
 * @param {HTMLSelectElement} languageSelect The language select element
 * @param {object[]} languages The language entries
 */
function appendLanguageOptions(languageSelect, languages) {
    for (const language of languages) {
        languageSelect.add(new Option(language.name, language.id));
    }
}

/**
 * Populate the version selector.
 * @param {HTMLSelectElement} versionSelect The version select element
 * @param {object[]} versions The available bible versions
 */
function populateVersionSelect(versionSelect, versions) {
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
 * Load saved language/translation settings.
 * @param {Function} callback Callback receiving settings
 */
function getStoredSettings(callback) {
    chrome.storage.sync.get({
        'language': DEFAULT_LANGUAGE,
        'translation': DEFAULT_TRANS
    }, callback);
}

/**
 * Save language/translation settings.
 * @param {{language: string, translation: string}} settings The settings to save
 * @param {Function} callback Callback after save
 */
function saveStoredSettings(settings, callback) {
    chrome.storage.sync.set({
        'language': settings.language,
        'translation': settings.translation
    }, callback);
}

/**
 * Notify content scripts to clear verse cache and update link translation/language settings.
 * @param {{language: string, translation: string}} settings The latest settings
 */
function broadcastSettingsUpdate(settings) {
    chrome.tabs.query({}, function (tabs) {
        for (const tab of tabs) {
            const supportedUrl = tab && tab.url && /^(?:https?|file):/i.test(tab.url);
            if (!supportedUrl) {
                continue;
            }

            chrome.tabs.sendMessage(tab.id, {
                contentScriptQuery: 'updateLinkSettings',
                language: settings.language,
                translation: settings.translation
            }, function () {
                // Ignore tabs without this content script loaded.
                void chrome.runtime.lastError;
            });
        }
    });
}

export {
    BIBLE_API_BASE_URL,
    DEFAULT_LANGUAGE,
    DEFAULT_TRANS,
    appendLanguageOptions,
    fetchLanguages,
    fetchVersions,
    getStoredSettings,
    populateVersionSelect,
    saveStoredSettings,
    broadcastSettingsUpdate
};
