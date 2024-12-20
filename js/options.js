/* global M */

import '@materializecss/materialize';
import '../css/options.scss';

const BIBLE_API_BASE_URL = 'https://api.scripture.api.bible/v1/';
const BIBLE_API_KEY = process.env.BIBLE_API_KEY;

const DEFAULT_TRANS = '9879dbb7cfe39e4d-04';
const DEFAULT_LANGUAGE = 'eng';

let version_select = document.querySelector('#bible-version');
let language_select = document.querySelector('#language');
let status = document.querySelector('#save-status');

/**
 * Verify that the response is good from the fetch call
 * @param {Response} response The response object
 * @returns {object} The JSON associated with the response
 * @throws Error if response is bad
 */
function check_fetch_ok_response(response) {
    if (!response.ok) {
        throw new Error('HTTP status ' + response.status);
    }
    return response.json();
}

/**
 * Gets the available bible languages
 * @param {Function} callback Function to call once the languages have been fetched
 */
function get_languages(callback) {
    fetch(`${BIBLE_API_BASE_URL}bibles`, {
        headers: new Headers({
            'api-key': BIBLE_API_KEY,
        }),
    })
        .then(check_fetch_ok_response)
        .then(response => {
            const separator = ':::';
            const versions = response.data.map(function (items) {
                return `${items.language.name}${separator}${items.language.id}`;
            });
            for (const version of [...new Set(versions)].sort()) {
                const [name, id] = version.split(separator);
                // English is the first item in the list
                if (id !== 'eng') {
                    language_select.add(new Option(name, id));
                }
            }
            callback();
            M.FormSelect.init(language_select, {});
        })
        .catch(error => {
            console.error(error);
        });
}

/**
 * Populate the version selector
 * @param {object} versions The available bible versions
 */
function populate_version_select(versions) {
    version_select.options.length = 0;
    for (let op in version_select.options) {
        version_select.remove(op);
    }
    for (const version of versions) {
        if (version['name'] !== '') {
            let fullName = version['name'];
            if (version['description']) {
                fullName += ` - ${version['description']}`;
            }
            version_select.add(new Option(fullName, version['id']));
        }
    }
}

/**
 * Get the available bible versions based on the selected language
 * @param {boolean} is_event If this is being called in response to an event
 * @param {Function} callback Function to call once the versions have been obtained
 */
function get_versions(is_event, callback) {
    // TODO: Remove extra fetch call, can just pass dictionary from language call
    fetch(`${BIBLE_API_BASE_URL}bibles?language=${language_select.options[language_select.selectedIndex].value}`, {
        headers: new Headers({
            'api-key': BIBLE_API_KEY,
        }),
    })
        .then(check_fetch_ok_response)
        .then(response => {
            populate_version_select(response.data);
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
 * Saves options to chrome.storage
 */
function save_options() {
    chrome.storage.sync.set({
        'language': language_select.options[language_select.selectedIndex].value,
        'translation': version_select.options[version_select.selectedIndex].value
    }, function () {
        // Update status to let user know options were saved.
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 2000);
    });
}

/**
 * Restores select box and checkbox state using the preferences stored in chrome.storage.
 * @param {Function} callback Function to call after the options are loaded
 */
function restore_options(callback) {
    chrome.storage.sync.get({
        'language': DEFAULT_LANGUAGE,
        'translation': DEFAULT_TRANS
    }, function (settings) {
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
