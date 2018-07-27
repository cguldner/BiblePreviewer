// TODO: Add version picker customization page
const BIBLE_API_KEY = 'omci89GV7FQlNgTIzDULkB16SyEuOr27xC49GEex';
const BIBLE_API_BASE_URL = `https://${BIBLE_API_KEY}@bibles.org/v2/`;
const DEFAULT_TRANS = 'eng-NASB';
// The translation to use if the version selected doesn't have the Catholic deuterocannonical books
const DEFAULT_DEUTERO_TRANS = 'eng-KJVA';
const BIBLE_DIRECT_URL = `https://bibles.org/${DEFAULT_TRANS}/`;

// Lookup dictionary for verses
let bibleVerseDict = {};

// I make a lot of the () non-capturing, so I can capture the chapter/verse numbers more easily later
let bibleBooks = {
    'Gen(?:esis)?': 'Gen',
    'Ex(?:od|odus)?': 'Exod',
    'Le(?:v|viticus)?': 'Lev',
    'Num(?:b|bers)?': 'Num',
    '(?:Dt|Deut(?:eronomy)?)': 'Deut',
    'Jos(?:h|hua)?': 'Josh',
    '(?:Jdgs?|Judg(?:es)?)': 'Judg',
    'Ru?th': 'Ruth',
    '(?:1|1st|I|First)\\s*Sam(?:uel)?': '1Sam',
    '(?:2|2nd|II|Second)\\s*Sam(?:uel)?': '2Sam',
    '(?:1|1st|I|First)\\s*(?:Kings|Kgs)': '1Kgs',
    '(?:2|2nd|II|Second)\\s*(?:Kings|Kgs)': '2Kgs',
    '(?:1|1st|I|First)\\s*Chr(?:on|onicles)?': '1Chr',
    '(?:2|2nd|II|Second)\\s*Chr(?:on|onicles)?': '2Chr',
    'Ez(?:r|ra)?': 'Ezra',
    'Ne(?:h|hemiah)?': 'Neh',
    'Tob(?:it)?': 'Tob',
    '(?:Jth|Jdt|Jdth|Judith)': 'Jdt',
    'Es(?:t|th|ther)': 'Esth',
    '(?:1|1st|I|First)\\s*Mac(?:cabees)?': '1 Macc',
    '(?:2|2nd|II|Second)\\s*Mac(?:cabees)?': '2 Macc',
    'Jo?b': 'Job',
    'Ps(?:a?lms?)?': 'Ps',
    'Pro(?:v|verbs)?': 'Prov',
    'Ecc(?:les?|lesiastes)?': 'Eccl',
    '(?:SOS|Song(?:\\s*of\\s*(?:Sol(?:omon)?|Songs?))?)': 'Song',
    'Wis(?:dom)?(?:\\s*of\\s*Sol(?:omon)?)?': 'Wis',
    'Sir(?:ach)?': 'Sir',
    'Bar(?:uch)?': 'Bar',
    'Is(?:a|aiah)?': 'Isa',
    'Jer(?:emiah)?': 'Jer',
    'Lam(?:entations)?': 'Lam',
    'Ez(?:e?k?|ekiel)?': 'Ezek',
    'Dan(?:iel)?': 'Dan',
    'Hos(?:ea)?': 'Hos',
    'Joel': 'Joel',
    'Amos': 'Amos',
    'Ob(?:ad|adiah)?': 'Obad',
    'Jon(?:ah)?': 'Jonah',
    'Mic(?:ah)?': 'Mic',
    'Nah(?:um)?': 'Nah',
    'Hab(?:akkuk)?': 'Hab',
    'Zep(?:h|haniah)?': 'Zeph',
    'Hag(?:gai)?': 'Hag',
    'Zec(?:h|hariah)?': 'Zech',
    'Mal(?:achi)?': 'Mal',
    '(?:Mt|Matt(?:hew)?)': 'Matt',
    '(?:Mk|Mark?)': 'Mark',
    '(?:Lk|Luke?)': 'Luke',
    'J(?:o?h)?n': 'John',
    'Acts?': 'Acts',
    'Ro(?:m|mans)?': 'Rom',
    '(?:1|1st|I|First)\\s*Co(?:r|rinthians)?': '1Cor',
    '(?:2|2nd|II|Second)\\s*Co(?:r|rinthians)?': '2Cor',
    'Gal(?:atians)?': 'Gal',
    'Eph(?:es|esians)?': 'Eph',
    'Phil(?:ippians)?': 'Phil',
    'Col(?:ossians)?': 'Col',
    '(?:1|1st|I|First)\\s*Thes(?:s|salonians)?': '1Thess',
    '(?:2|2nd|II|Second)\\s*Thes(?:s|salonians)?': '2Thess',
    '(?:1|1st|I|First)\\s*Ti(?:m|mothy)?': '1Tim',
    '(?:2|2nd|II|Second)\\s*Ti(?:m|mothy)?': '2Tim',
    'Titus': 'Titus',
    'Phil(?:em|emon)?': 'Phil',
    'Heb(?:rews?)?': 'Heb',
    'James': 'Jas',
    '(?:1|1st|I|First)\\s*P(?:et|eter|t)?': '1Pet',
    '(?:2|2nd|II|Second)\\s*P(?:et|eter|t)?': '2Pet',
    '(?:1|1st|I|First)\\s*J(?:o?h)?n': '1John',
    '(?:2|2nd|II|Second)\\s*J(?:o?h)?n': '2John',
    '(?:3|3rd|III|Third)\\s*J(?:o?h)?n': '3John',
    'Jude?': 'Jud',
    'Re(?:v|velation)?': 'Rev'
};

// The regex to match book names
// TODO: Allow for different start and end chapters
// let bibleRegex = '(' + Object.keys(bibleBooks).join('\\.?|') + '\\.';
// bibleRegex += ')\\s([0-9]{0,3})(?:\\s|:)([0-9]{1,2})(?:(?:–|—|-)([0-9]{1,2}))?';
// bibleRegex = new RegExp(bibleRegex, 'gi');

let bibleRegex = /(Gen(?:esis)?\.?|Ex(?:od|odus)?\.?|Le(?:v|viticus)?\.?|Num(?:b|bers)?\.?|(?:Dt|Deut(?:eronomy)?)\.?|Jos(?:h|hua)?\.?|(?:Jdgs?|Judg(?:es)?)\.?|Ru?th\.?|(?:1|1st|I|First)\s*Sam(?:uel)?\.?|(?:2|2nd|II|Second)\s*Sam(?:uel)?\.?|(?:1|1st|I|First)\s*(?:Kings|Kgs)\.?|(?:2|2nd|II|Second)\s*(?:Kings|Kgs)\.?|(?:1|1st|I|First)\s*Chr(?:on|onicles)?\.?|(?:2|2nd|II|Second)\s*Chr(?:on|onicles)?\.?|Ez(?:r|ra)?\.?|Ne(?:h|hemiah)?\.?|Tob(?:it)?\.?|(?:Jth|Jdt|Jdth|Judith)\.?|Es(?:t|th|ther)\.?|(?:1|1st|I|First)\s*Mac(?:cabees)?\.?|(?:2|2nd|II|Second)\s*Mac(?:cabees)?\.?|Jo?b\.?|Ps(?:a?lms?)?\.?|Pro(?:v|verbs)?\.?|Ecc(?:les?|lesiastes)?\.?|(?:SOS|Song(?:\s*of\s*(?:Sol(?:omon)?|Songs?))?)\.?|Wis(?:dom)?(?:\s*of\s*Sol(?:omon)?)?\.?|Sir(?:ach)?\.?|Bar(?:uch)?\.?|Is(?:a|aiah)?\.?|Jer(?:emiah)?\.?|Lam(?:entations)?\.?|Ez(?:e?k?|ekiel)?\.?|Dan(?:iel)?\.?|Hos(?:ea)?\.?|Joel\.?|Amos\.?|Ob(?:ad|adiah)?\.?|Jon(?:ah)?\.?|Mic(?:ah)?\.?|Nah(?:um)?\.?|Hab(?:akkuk)?\.?|Zep(?:h|haniah)?\.?|Hag(?:gai)?\.?|Zec(?:h|hariah)?\.?|Mal(?:achi)?\.?|(?:Mt|Matt(?:hew)?)\.?|(?:Mk|Mark?)\.?|(?:Lk|Luke?)\.?|J(?:o?h)?n\.?|Acts?\.?|Ro(?:m|mans)?\.?|(?:1|1st|I|First)\s*Co(?:r|rinthians)?\.?|(?:2|2nd|II|Second)\s*Co(?:r|rinthians)?\.?|Gal(?:atians)?\.?|Eph(?:es|esians)?\.?|Phil(?:ippians)?\.?|Col(?:ossians)?\.?|(?:1|1st|I|First)\s*Thes(?:s|salonians)?\.?|(?:2|2nd|II|Second)\s*Thes(?:s|salonians)?\.?|(?:1|1st|I|First)\s*Ti(?:m|mothy)?\.?|(?:2|2nd|II|Second)\s*Ti(?:m|mothy)?\.?|Titus\.?|Phil(?:em|emon)?\.?|Heb(?:rews?)?\.?|James\.?|(?:1|1st|I|First)\s*P(?:et|eter|t)?\.?|(?:2|2nd|II|Second)\s*P(?:et|eter|t)?\.?|(?:1|1st|I|First)\s*J(?:o?h)?n\.?|(?:2|2nd|II|Second)\s*J(?:o?h)?n\.?|(?:3|3rd|III|Third)\s*J(?:o?h)?n\.?|Jude?\.?|Re(?:v|velation)?\.)\s([0-9]{0,3})(?:\s|:)([0-9]{1,2})(?:[–—-]([0-9]{1,2}))?/gi;

// console.log(bibleRegex);

// Starts the app only once the page has completely finished loading
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    initBiblePreviewer();
});

/**
 * Initializes the app
 */
function initBiblePreviewer() {
    transformBibleReferences();
    createTooltips();
}

/**
 * Transform all bible references into links using a TreeWalker
 */
function transformBibleReferences() {
    // Use a TreeWalker instead of simple replace so we can ignore bible references that are already links
    let treeWalker = document.createTreeWalker(document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // Check for a book of the bible, and that the text isn't already a link
                if (node.textContent.match(bibleRegex) && node.parentElement.closest('a') === null) {
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        },
        false
    );

    let nodeList = [];
    // Since the tree walker returns text nodes, get all the elements containing those text nodes in the walker
    while (treeWalker.nextNode()) {
        let newNode = treeWalker.currentNode.parentNode, shouldAdd = true;
        for (let i = nodeList.length - 1; i >= 0; i--) {
            let prevNode = nodeList[i];
            // Don't add this node if it has already been added, or it's parent is in the list
            if (prevNode === newNode || prevNode.contains(newNode)) {
                shouldAdd = false;
                break;
            }
            // If we found a child of the new node, remove it from the list
            if (newNode.contains(prevNode)) nodeList.splice(i, 1);
        }
        if (shouldAdd) nodeList.push(newNode);
    }
    // console.log(nodeList);

    nodeList.forEach(function (node) {
        // m - original text, b - book, c - chapter, s - start verse, e - end verse (optional)
        node.innerHTML = node.innerHTML.replace(bibleRegex, function (m, b, c, s, e) {
            let book = '';
            // TODO: Figure out a more efficient way to do this
            for (let key in bibleBooks) {
                if (b.search(key) > -1) {
                    book = bibleBooks[key];
                    // If the book is John, continue searching to verify it isn't 1, 2, 3 John
                    if (book !== 'John')
                        break;
                }
            }
            if (book === '') {
                console.error('Couldn\'t match ' + m);
                return m;
            }
            let linkHref = `${BIBLE_DIRECT_URL + book}/${c}/${s}`;
            if (e) linkHref += `-${e}`;
            // TODO: Make this match a list of verses where the book is the same, e.g. Eph. 2:1, 2:5, 4:18
            return '<div class="biblePreviewerContainer">' +
                `<a class="biblePreviewerLink" href="${linkHref}" target="_blank"
                    data-bible-ref="${createAPILink(book, c, s, e)}">${m}</a>` +
                '</div>';
        });
    });
}

function transformUsingReplace() {
    document.body.innerHTML = document.body.innerHTML.replace(bibleRegex, function (m, b, c, s, e) {
        let book = '';
        for (let key in bibleBooks) {
            if (b.search(key) > -1) {
                book = bibleBooks[key];
                // If the book is John, continue searching to verify it isn't 1, 2, 3 John
                if (book !== 'John')
                    break;
            }
        }
        if (book === '') {
            console.error('Couldn\'t match ' + m);
            return m;
        }
        let linkHref = `${BIBLE_DIRECT_URL + book}/${c}/${s}`;
        if (e) linkHref += `-${e}`;
        return '<span class="biblePreviewerContainer">' +
            `<a class="biblePreviewerLink" href="${linkHref}" target="_blank"
                    data-bible-ref="${createAPILink(book, c, s, e)}">${m}</a>` +
            '</span>';
    });
}

// TODO: Make this dynamically shorten the verse text if too long
/**
 * Create the tooltip popups that will show the verse text above the link on hover
 */
function createTooltips() {
    document.querySelectorAll('.biblePreviewerLink').forEach(function (link) {
        let tool, enterTimeout, exitTimeout;
        // Add listener to biblePreviewerContainer so that we can hover over the tooltip as well
        link.parentElement.addEventListener('mouseover', function (e) {
            clearTimeout(exitTimeout);
            enterTimeout = setTimeout(function () {
                if (link.nextSibling === null) {
                    tool = new Tooltip(link, {
                        placement: 'top',
                        title: 'Loading',
                        trigger: 'manual',
                        html: true,
                        // arrowSelector: '.bpTooltipArrow',
                        // innerSelector: '.bpTooltipInner',
                        template: '<div class="biblePreviewerTooltip" role="tooltip">' +
                            '<div class="tooltip-inner"></div>' +
                            '<div class="tooltip-arrow"></div>' +
                            '</div>',
                        // TODO: Figure out why sometimes this makes tooltip appear way above link
                        // boundariesElement: document.body
                    });
                }
                if (bibleVerseDict[link.dataset.bibleRef] === undefined) {
                    sendAPIRequestForVerses(link.dataset.bibleRef, function (verseObj) {
                        if (verseObj) {
                            let verseText = verseObj.join('');
                            tool.updateTitleContent(verseText);
                            // Store into a dictionary for quick access later
                            bibleVerseDict[link.dataset.bibleRef] = verseText;
                        } else {
                            tool.updateTitleContent('Couldn\'t find verse');
                        }
                    });
                }
                else {
                    tool.updateTitleContent(bibleVerseDict[link.dataset.bibleRef]);
                }
                tool.show();
            }, 250);
        });
        link.parentElement.addEventListener('mouseleave', function (e) {
            clearTimeout(enterTimeout);
            // Destroy the tooltip to prevent any stray tooltips if mouse is moved fast
            exitTimeout = setTimeout(function () {
                if (tool) tool.hide();
            }, 750);
        });
    });
}

/**
 * Create link to the Bible API
 * @param {string} book - OSIS abbreviation of the book
 * @param {number} chapter - chapter number
 * @param {number} startVerse - what verse to start reading from
 * @param {number} endVerse - what verse to end reading at
 * @returns {string}
 */
function createAPILink(book, chapter, startVerse, endVerse) {
    let bibleLink = `${BIBLE_API_BASE_URL}chapters/${DEFAULT_TRANS}:${book}.${chapter}/verses.js?start=${startVerse}`;
    let end = endVerse ? endVerse : startVerse;
    bibleLink += '&end=' + end;
    return bibleLink;
}

/**
 * Sends a request to the bible API for the specified verses
 * @param requestLink - The link to get the verse from
 * @param cb - What to do after the API returns the verse
 */
function sendAPIRequestForVerses(requestLink, cb) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', requestLink, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                let verses = JSON.parse(xhr.responseText).response.verses;
                if (verses === undefined) {
                    cb(null, 404);
                }
                else {
                    cb(verses.map(function (verse) {
                        return verse.text;
                    }));
                }
            }
            else {
                cb(null, xhr.status);
            }
        }
    };
    xhr.send();
}
