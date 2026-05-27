import '../css/generated/popup.css';
import {
    BIBLE_API_KEY,
    initializeVersionSelectors,
    loadVersionOptions,
    saveSelectedSettings
} from './settingsShared.js';

const versionSelect = document.querySelector('#bible-version');
const languageSelect = document.querySelector('#language');

/**
 * Save popup selections and notify content scripts if settings changed.
 */
function saveOptionsIfSettingsChanged() {
    saveSelectedSettings(languageSelect, versionSelect, '#save-status');
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
    initializeVersionSelectors(BIBLE_API_KEY, languageSelect, versionSelect);

    languageSelect.addEventListener('change', function () {
        loadVersionOptions(BIBLE_API_KEY, languageSelect, versionSelect)
            .then(function () {
                saveOptionsIfSettingsChanged();
            })
            .catch(function (error) {
                console.error(error);
            });
    });

    versionSelect.addEventListener('change', saveOptionsIfSettingsChanged);
});
