// TODO: Allow ability for non english versions
let xhr = new XMLHttpRequest();

xhr.open('GET', 'https://omci89GV7FQlNgTIzDULkB16SyEuOr27xC49GEex@bibles.org/v2/versions.js', true);
xhr.onreadystatechange = get_versions;
xhr.send();

let version_select = document.getElementById("bible-version");

function get_versions() {
    let versions = JSON.parse(xhr.responseText).response.versions;
    // Reduce the versions to english ones, with only the translation name and the abbreviation
    versions = versions.reduce(function (filtered, version) {
        if (version.lang.match('eng') && version["name"].length !== 0) {
            filtered.push({'full_name': version['name'], 'abbrev': "eng-" + version['abbreviation']});
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
        "translation": version_select.options[version_select.selectedIndex].value
    }, function () {
        // Update status to let user know options were saved.
        let status = document.getElementById('save-status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 1000);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        "translation": "eng-NASB"
    }, function (items) {
        version_select.value = items["translation"];
    });
}

document.getElementById('save').addEventListener('click', save_options);