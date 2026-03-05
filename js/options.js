/* global M */

import '@materializecss/materialize';
import '../css/options.scss';
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

let version_select = document.querySelector('#bible-version');
let language_select = document.querySelector('#language');
let status = document.querySelector('#save-status');

/**
 * Gets the available bible languages
 * @param {Function} callback Function to call once the languages have been fetched
 */
function get_languages(callback) {
    fetchLanguages(BIBLE_API_KEY)
        .then(languages => {
            appendLanguageOptions(language_select, languages);
            callback();
            M.FormSelect.init(language_select, {});
        })
        .catch(error => {
            console.error(error);
        });
}

/**
 * Get the available bible versions based on the selected language
 * @param {boolean} is_event If this is being called in response to an event
 * @param {Function} callback Function to call once the versions have been obtained
 */
function get_versions(is_event, callback) {
    fetchVersions(BIBLE_API_KEY, language_select.options[language_select.selectedIndex].value)
        .then(versions => {
            populateVersionSelect(version_select, versions);
            if (!is_event) {
                callback();
            }
            // Reinitialize the select to show the new options
            M.FormSelect.init(version_select, {});
            version_select.removeAttribute('disabled');
        })
        .catch(error => {
            console.error(error);
        });
}

/**
 * Saves options and updates open tabs when settings change.
 */
function save_options() {
    const new_settings = {
        language: language_select.options[language_select.selectedIndex].value,
        translation: version_select.options[version_select.selectedIndex].value
    };

    getStoredSettings(function (previous_settings) {
        saveStoredSettings(new_settings, function () {
            if (previous_settings.language !== new_settings.language
                || previous_settings.translation !== new_settings.translation) {
                broadcastSettingsUpdate(new_settings);
            }
            // Update status to let user know options were saved.
            status.textContent = 'Options saved.';
            setTimeout(function () {
                status.textContent = '';
            }, 2000);
        });
    });
}

/**
 * Restores select box and checkbox state using the preferences stored in chrome.storage.
 * @param {Function} callback Function to call after the options are loaded
 */
function restore_options(callback) {
    getStoredSettings(function (settings) {
        document.querySelector('#save-button').classList.remove('disabled');
        callback(settings);
    });
}

document.querySelector('#save-button').addEventListener('click', save_options);

document.addEventListener('DOMContentLoaded', function () {
    restore_options(function (settings) {
        get_languages(function () {
            M.FormSelect.init(language_select, {});
            language_select.value = settings['language'];
            get_versions(false, function () {
                M.FormSelect.init(version_select, {});
                version_select.value = settings['translation'];
                version_select.removeAttribute('disabled');
            });
        });
    });
    document.querySelector('#language').addEventListener('change', get_versions);
});
