import 'materialize-css';
import '../css/options.scss';

const BIBLE_API_BASE_URL = 'https://api.scripture.api.bible/v1/';
const BIBLE_API_KEY = '5b84d02c13d0f6135804a4aafc5f4040';

const DEFAULT_TRANS = '9879dbb7cfe39e4d-04';
const DEFAULT_LANGUAGE = 'eng';

let version_select = document.getElementById('bible-version');
let language_select = document.getElementById('language');
let status = document.getElementById('save-status');

/**
 * Gets the available bible languages
 *
 * @param {Function} cb Function to call once the languages have been fetched
 */
function get_languages(cb) {
    fetch(`${BIBLE_API_BASE_URL}bibles`, {
        headers: new Headers({
            'api-key': BIBLE_API_KEY,
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('HTTP status ' + response.status);
            }
            return response.json();
        })
        .then(res => {
            const separator = ':::';
            const versions = res.data.map(function (items) {
                return `${items.language.name}${separator}${items.language.id}`;
            });
            for (const version of Array.from(new Set(versions)).sort()) {
                const [name, id] = version.split(separator);
                // English is the first item in the list
                if (id !== 'eng') {
                    language_select.add(new Option(name, id));
                }
            }
            cb();
            // eslint-disable-next-line no-undef
            M.FormSelect.init(language_select, {});
        })
        .catch(error => {
            console.error(error);
        });
}

/**
 * Populate the version selector
 *
 * @param {object} versions The available bible versions
 */
function populate_version_select(versions) {
    version_select.options.length = 0;
    for (let op in version_select.options) {
        version_select.remove(op);
    }
    for (const ver of versions) {
        if (ver['name'] !== '') {
            let fullName = ver['name'];
            if (ver['description']) {
                fullName += ` - ${ver['description']}`;
            }
            version_select.add(new Option(fullName, ver['id']));
        }
    }
}

/**
 * Get the available bible versions based on the selected language
 *
 * @param {boolean} is_event If this is being called in response to an event
 * @param {Function} cb Function to call once the versions have been obtained
 */
function get_versions(is_event, cb) {
    // TODO: Remove extra fetch call, can just pass dictionary from language call
    fetch(`${BIBLE_API_BASE_URL}bibles?language=${language_select.options[language_select.selectedIndex].value}`, {
        headers: new Headers({
            'api-key': BIBLE_API_KEY,
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('HTTP status ' + response.status);
            }
            return response.json();
        })
        .then(res => {
            populate_version_select(res.data);
            if (!is_event) {
                cb();
            }
            // Reinitialize the select to show the new options
            // eslint-disable-next-line no-undef
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
 *
 * @param {Function} cb Function to call after the options are loaded
 */
function restore_options(cb) {
    chrome.storage.sync.get({
        'language': DEFAULT_LANGUAGE,
        'translation': DEFAULT_TRANS
    }, function (settings) {
        document.getElementById('save-button').classList.remove('disabled');
        cb(settings);
    });
}

document.getElementById('save-button').addEventListener('click', save_options);

document.addEventListener('DOMContentLoaded', function () {
    restore_options(function (settings) {
        // eslint-disable-next-line no-undef
        M.FormSelect.init(language_select, {});
        language_select.value = settings['language'];
        get_languages(function() {
            get_versions(false, function () {
                version_select.value = settings['translation'];
                version_select.removeAttribute('disabled');
            });
        });
    });
    document.getElementById('language').onchange = get_versions;
});
