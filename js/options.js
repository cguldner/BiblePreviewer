import '../css/options.scss';

const BIBLE_API_KEY = '5b84d02c13d0f6135804a4aafc5f4040';

let xhr = new XMLHttpRequest();

let version_select = document.getElementById('bible-version');
let language_select = document.getElementById('language');
let status = document.getElementById('save-status');

/**
 * Gets the available bible languages
 */
function get_languages() {
    xhr.open('GET', `https://${BIBLE_API_KEY}@bibles.org/v2/versions.js`, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let versions = JSON.parse(xhr.responseText).response.versions;
            versions = versions.map(function (items) {
                return items.lang_name_eng + ':::' + items.lang;
            });
            console.log(Array.from(new Set(versions)).sort());
        }
    };
    xhr.send();
}

/**
 * Populate the version selector
 */
function populate() {
    let versions = JSON.parse(xhr.responseText).response.versions;
    version_select.options.length = 0;
    for (let op in version_select.options) {
        version_select.remove(op);
    }
    for (let v in versions) {
        if (versions[v]['name'] !== '') {
            version_select.add(new Option(versions[v]['name'], versions[v]['abbreviation']));
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
    xhr.open(
        'GET',
        `https://${BIBLE_API_KEY}@bibles.org/v2/versions.js?language=${language_select.options[language_select.selectedIndex].value}`,
        true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            populate();
            if (!is_event) {
                cb();
            }
            // Reinitialize the select to show the new options
            // eslint-disable-next-line no-undef
            M.FormSelect.init(version_select, {});
        }
    };
    xhr.send();
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
        'language': 'eng-US',
        'translation': 'NASB'
    }, function (items) {
        language_select.value = items['language'];
        document.getElementById('save-button').classList.remove('disabled');
        cb(items['translation']);
    });
}

document.getElementById('save-button').addEventListener('click', save_options);

document.addEventListener('DOMContentLoaded', function () {
    restore_options(function (version_value) {
        // eslint-disable-next-line no-undef
        M.FormSelect.init(language_select, {});
        get_versions(false, function () {
            version_select.value = version_value;
            version_select.removeAttribute('disabled');
        });
        get_languages();
    });
    document.getElementById('language').onchange = get_versions;
});
