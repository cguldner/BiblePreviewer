// import 'materialize-css';
import '../css/options.scss';
import {BIBLE_API_KEY} from './biblePreviewer';


// TODO: Allow ability for non english versions
let xhr = new XMLHttpRequest();
let elems = document.querySelectorAll('select');

let version_select = document.getElementById('bible-version');
let language_select = document.getElementById('language');
let status = document.getElementById('save-status');

document.addEventListener('DOMContentLoaded', function () {
    M.FormSelect.init(elems, {});
    restore_options(function () {
        get_versions();
        // get_languages();
    });
    document.getElementById('language').onchange = get_versions;
});

/*function get_languages() {
    xhr.open('GET', `https://${BIBLE_API_KEY}@bibles.org/v2/versions.js`, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let versions = JSON.parse(xhr.responseText).response.versions;
            versions = versions.map(function (items) {
                return items.lang_name_eng + ":::" + items.lang;
            });
            console.log(Array.from(new Set(versions)).sort());
        }
    };
    xhr.send();
}*/

function get_versions() {
    xhr.open('GET', `https://${BIBLE_API_KEY}@bibles.org/v2/versions.js?language=${language_select.options[language_select.selectedIndex].value}`, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            populate();
        }
    };
    xhr.send();
}

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
    M.FormSelect.init(elems, {});
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
        }, 2000);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options(cb) {
    chrome.storage.sync.get({
        'language': 'eng-US',
        'translation': 'eng-NASB'
    }, function (items) {
        language_select.value = items['language'];
        version_select.value = items['translation'];
        version_select.removeAttribute('disabled');
        // Reinitialize the select to show the new options
        M.FormSelect.init(version_select, {});
        document.getElementById('save-button').classList.remove('disabled');
        cb();
    });
}

document.getElementById('save-button').addEventListener('click', save_options);
