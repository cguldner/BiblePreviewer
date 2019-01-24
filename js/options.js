// import 'materialize-css';
import '../css/options.scss';

const BIBLE_API_KEY = 'omci89GV7FQlNgTIzDULkB16SyEuOr27xC49GEex';

// TODO: Allow ability for non english versions
let xhr = new XMLHttpRequest();

xhr.open('GET', `https://${BIBLE_API_KEY}@bibles.org/v2/versions.js`, true);
xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
        get_versions();
    }
};
xhr.send();

let version_select = document.getElementById('bible-version');
let language_select = document.getElementById('language');
let status = document.getElementById('save-status');

document.addEventListener('DOMContentLoaded', function () {
    let instances = M.FormSelect.init(document.querySelectorAll('select'), {});
});

function get_versions() {
    let versions = JSON.parse(xhr.responseText).response.versions;
    // Reduce the versions to english ones, with only the translation name and the abbreviation
    versions = versions.reduce(function (filtered, version) {
        if (version.lang.match('eng') && version['name'].length !== 0) {
            filtered.push({'full_name': version['name'], 'abbrev': 'eng-' + version['abbreviation']});
        }
        return filtered;
    }, []);

    for (let v in versions) {
        version_select.add(new Option(versions[v]['full_name'], versions[v]['abbrev']));
    }
    restore_options();
}

// Saves options to chrome.storage
function save_options() {
    chrome.storage.sync.set({
        'language': language_select.options[language_select.selectedIndex].value,
        'translation': version_select.options[version_select.selectedIndex].value
    }, function () {
        // Update status to let user know options were saved.
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 1000);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({
        'language': 'eng',
        'translation': 'eng-NASB'
    }, function (items) {
        language_select.value = items['language'];
        version_select.value = items['translation'];
        version_select.removeAttribute('disabled');
        // Reinitialize the select to show the new options
        M.FormSelect.init(version_select, {});
        document.getElementById('save-button').classList.remove('disabled');
    });
}

document.getElementById('save-button').addEventListener('click', save_options);
