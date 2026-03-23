import '../css/generated/popup.css';
import {
    appendLanguageOptions,
    fetchLanguages,
    fetchVersions,
    getStoredSettings,
    populateVersionSelect,
    saveStoredSettings,
    broadcastSettingsUpdate
} from './settingsShared.js';

const BIBLE_API_KEY = process.env.BIBLE_API_KEY;

const versionSelect = document.querySelector('#bible-version');
const languageSelect = document.querySelector('#language');
const status = document.querySelector('#save-status');

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
 * Save popup selections and notify content scripts if settings changed.
 */
function saveOptionsIfSettingsChanged() {
    const newSettings = {
        language: languageSelect.options[languageSelect.selectedIndex].value,
        translation: versionSelect.options[versionSelect.selectedIndex].value
    };

    getStoredSettings(function (previousSettings) {
        saveStoredSettings(newSettings, function () {
            if (previousSettings.language !== newSettings.language
                || previousSettings.translation !== newSettings.translation) {
                broadcastSettingsUpdate(newSettings);
            }
            updateStatus('Selection saved.');
        });
    });
}

/**
 * Get the available bible versions based on the selected language
 * @param {Function} callback Function to call once the versions have been obtained
 */
function getVersions(callback) {
    fetchVersions(BIBLE_API_KEY, languageSelect.options[languageSelect.selectedIndex].value)
        .then(versions => {
            populateVersionSelect(versionSelect, versions);
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
    fetchLanguages(BIBLE_API_KEY)
        .then(languages => {
            appendLanguageOptions(languageSelect, languages);
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
    getStoredSettings(callback);
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
            saveOptionsIfSettingsChanged();
        });
    });

    versionSelect.addEventListener('change', saveOptionsIfSettingsChanged);
});
