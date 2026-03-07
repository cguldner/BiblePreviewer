import '../css/popup.scss';
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
const blacklistButton = document.querySelector('#blacklist-button');

let currentSiteHost = '';

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
 * Parse a host from a URL string for blacklist matching.
 * @param {string} url URL to parse
 * @returns {string} Lowercased hostname or empty string if unsupported
 */
function getSiteHost(url) {
    try {
        const parsedUrl = new URL(url);
        if (!['http:', 'https:', 'file:'].includes(parsedUrl.protocol)) {
            return '';
        }
        return parsedUrl.hostname.toLowerCase();
    } catch {
        return '';
    }
}

/**
 * Set blacklist button state based on active host and stored blacklist.
 * @param {string[]} blacklist Stored blacklist hostnames
 */
function updateBlacklistButton(blacklist) {
    if (!currentSiteHost) {
        blacklistButton.textContent = 'Blacklist Unavailable';
        blacklistButton.setAttribute('disabled', 'disabled');
        return;
    }

    const isBlacklisted = blacklist.includes(currentSiteHost);
    blacklistButton.removeAttribute('disabled');
    blacklistButton.textContent = isBlacklisted ? 'Remove Site From Blacklist' : 'Blacklist This Website';
}

/**
 * Toggle blacklist state for the active site.
 */
function toggleBlacklistForCurrentSite() {
    if (!currentSiteHost) {
        return;
    }

    getStoredSettings(function (settings) {
        const blacklist = Array.isArray(settings.blacklist) ? settings.blacklist : [];
        const blacklistSet = new Set(blacklist.map(host => host.toLowerCase()));

        if (blacklistSet.has(currentSiteHost)) {
            blacklistSet.delete(currentSiteHost);
            updateStatus('Site removed from blacklist.');
        } else {
            blacklistSet.add(currentSiteHost);
            updateStatus('Site added to blacklist.');
        }

        const newBlacklist = [...blacklistSet].sort();
        saveStoredSettings({blacklist: newBlacklist}, function () {
            updateBlacklistButton(newBlacklist);
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                const activeTab = tabs[0];
                if (activeTab?.id !== undefined) {
                    chrome.tabs.reload(activeTab.id);
                }
            });
        });
    });
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

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            const activeTab = tabs[0];
            currentSiteHost = activeTab?.url ? getSiteHost(activeTab.url) : '';
            updateBlacklistButton(Array.isArray(settings.blacklist) ? settings.blacklist : []);
        });
    });

    languageSelect.addEventListener('change', function () {
        getVersions(function () {
            saveOptionsIfSettingsChanged();
        });
    });

    versionSelect.addEventListener('change', saveOptionsIfSettingsChanged);
    blacklistButton.addEventListener('click', toggleBlacklistForCurrentSite);
});
