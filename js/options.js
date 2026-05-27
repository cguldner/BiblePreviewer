import '../css/generated/options.css';
import {
    BIBLE_API_KEY,
    initializeVersionSelectors,
    loadVersionOptions,
    saveSelectedSettings
} from './settingsShared.js';

let versionSelect = document.querySelector('#bible-version');
let languageSelect = document.querySelector('#language');

/**
 * Saves options and updates open tabs when settings change.
 */
function save_options() {
    saveSelectedSettings(languageSelect, versionSelect, '#save-status');
}

document.querySelector('#save-button').addEventListener('click', save_options);

document.addEventListener('DOMContentLoaded', function () {
    initializeVersionSelectors(BIBLE_API_KEY, languageSelect, versionSelect);
    languageSelect.addEventListener('change', function () {
        loadVersionOptions(BIBLE_API_KEY, languageSelect, versionSelect)
            .catch(function (error) {
                console.error(error);
            });
    });
});
