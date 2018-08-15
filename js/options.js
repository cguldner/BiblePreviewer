// TODO: Allow ability for non english versions
let xhr = new XMLHttpRequest();

xhr.open('GET', 'https://omci89GV7FQlNgTIzDULkB16SyEuOr27xC49GEex@bibles.org/v2/versions.js', true);
xhr.onreadystatechange = function () {
    let version_select = document.getElementById('bible_version');
    let versions = JSON.parse(xhr.responseText).response.versions;
    // Reduce the versions to english ones, with only the translation name and the abbreviation
    versions = versions.reduce(function (filtered, version) {
        if (version.lang.match('eng')) {
            filtered.push({'full_name': version['name'], 'abbrev': version['abbreviation']});
        }
        return filtered;
    }, []);
    for (let v in versions) {
        version_select.add(new Option(versions[v]['full_name'], versions[v]['abbrev']));
    }


};
xhr.send();
