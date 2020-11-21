// TODO: Add font size selector to the option panel
// TODO: Add version selector to the popup.html
// TODO: Add turning off on specific websites to popup.html
import '../css/biblePreviewer.scss';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'; // optional for styling

// const ESV_API_KEY = '52ca2a57f09495325d251464d417edc1cfe94834';

const BIBLE_API_BASE_URL = 'https://api.scripture.api.bible/v1/';
// const ESV_API_BASE_URL = `https://api.esv.org/v3/passage/text/?q=`;
const DEFAULT_TRANS = 'de4e12af7f28f599-02';
// The translation to use if the version selected doesn't have the Catholic deuterocannonical books
const DEFAULT_DEUTERO_TRANS = 'eng-KJVA';
const BIBLE_DIRECT_URL = 'https://bibles.org/bible/';

const versions_with_deutero = ['eng-KJVA'];
const deutero_books = ['1Macc', '2Macc', 'Wis', 'Sir', 'Bar', 'Tob', 'Jdt'];
// const books_start_with_num = '(?:Sam(?:uel)?|K(?:(?:in)?gs)|Chr(?:on(?:icles)?)?|Mac(?:c|cabees)?|Co(?:r(?:inthians)?)?|Thes(?:s(?:alonians)?)?|T(?:i?m?|imothy)|Pe?t(?:er)?|Jo?h?n)';
const firstPrefix = '(?:1(?:st)?|I|First)\\s*';
const secondPrefix = '(?:2(?:nd)?|II|Second)\\s*';
const thirdPrefix = '(?:3(?:rd)?|III|Third)\\s*';
const dashes = /[–—-]/;

// Lookup dictionary for verses
let bibleVerseDict = {};

// I make a lot of the () non-capturing, so I can capture the chapter/verse numbers more easily later
const bibleBooks = {
    'Gen(?:esis)?': 'Gen',
    'Ex(?:od(?:us)?)?': 'Exo',
    'Le(?:v(?:iticus)?)?': 'Lev',
    'Num(?:b(?:ers)?)?': 'Num',
    'D(?:t|eut(?:eronomy)?)': 'Deu',
    'Jo(?:s(?:h(?:ua)?)?)?': 'Jos',
    'J(?:dgs?|udg(?:es)?)': 'Jdg',
    'Ru?th': 'Rut',
    [firstPrefix + 'Sam(?:uel)?']: '1Sa',
    [secondPrefix + 'Sam(?:uel)?']: '2Sa',
    [firstPrefix + 'K(?:(?:in)?gs)']: '1Ki',
    [secondPrefix + 'K(?:(?:in)?gs)']: '2Ki',
    [firstPrefix + 'Chr(?:on(?:icles)?)?']: '1Ch',
    [secondPrefix + 'Chr(?:on(?:icles)?)?']: '2Ch',
    'Ez(?:ra?)?': 'Ezr',
    'Ne(?:h(?:emiah)?)?': 'Neh',
    'Tob(?:it|ias)?': 'Tob',
    'J(?:d?th?|udith)': 'Jdt',
    'Est(?:h(?:er)?)?': 'Est',
    [firstPrefix + 'Mac(?:c(?:abees)?)?']: '1Ma',
    [secondPrefix + 'Mac(?:c(?:abees)?)?']: '2Ma',
    'Jo?b': 'Job',
    'Ps(?:a(?:lms?)?)?': 'Psa',
    'Pro(?:v(?:erbs)?)?': 'Pro',
    'Ecc(?:les?|lesiastes)?': 'Ecc',
    'So(?:S|ng(?:\\s*of\\s*(?:Sol(?:omon)?|Songs?))?)': 'Sng',
    'Wis(?:dom)?(?:\\s*of\\s*Sol(?:omon)?)?': 'Wis',
    'Sir(?:ach)?': 'Sir',
    'Bar(?:uch)?': 'Bar',
    'Is(?:a(?:iah)?)?': 'Isa',
    'Jer(?:emiah)?': 'Jer',
    'Lam(?:entations)?': 'Lam',
    'Ez(?:e?k?|ekiel)': 'Ezk',
    'Dan(?:iel)?': 'Dan',
    'Hos(?:ea)?': 'Hos',
    'Joel': 'Jol',
    'Amos': 'Amo',
    'Ob(?:ad(?:iah)?)?': 'Oba',
    'Jon(?:ah)?': 'Jon',
    'Mic(?:ah)?': 'Mic',
    'Nah(?:um)?': 'Nam',
    'Hab(?:akkuk)?': 'Hab',
    'Zep(?:h(?:aniah)?)?': 'Zep',
    'Hag(?:gai)?': 'Hag',
    'Zec(?:h(?:ariah)?)?': 'Zec',
    'Mal(?:achi)?': 'Mal',
    'M(?:t|att(?:h(?:ew)?)?)': 'Mat',
    'M(?:k|ark?)': 'Mrk',
    'L(?:k|uke?)': 'Luk',
    'Jo?h?n': 'Jhn',
    'Acts?': 'Act',
    'Ro(?:m(?:ans)?)?': 'Rom',
    [firstPrefix + 'Co(?:r(?:inthian(?:s)?)?)?']: '1Co',
    [secondPrefix + 'Co(?:r(?:inthian(?:s)?)?)?']: '2Co',
    'Gal(?:atians)?': 'Gal',
    'Eph(?:es(?:ians)?)?': 'Eph',
    'Phil(?:ippians)?': 'Php',
    'Col(?:ossians)?': 'Col',
    [firstPrefix + 'Thes(?:s(?:alonians)?)?']: '1Th',
    [secondPrefix + 'Thes(?:s(?:alonians)?)?']: '2Th',
    [firstPrefix + 'T(?:i?m?|imothy)']: '1Ti',
    [secondPrefix + 'T(?:i?m?|imothy)']: '2Ti',
    'Titus': 'Tit',
    'Phil(?:em(?:on)?)?': 'Phm',
    'Heb(?:rews?)?': 'Heb',
    'James': 'Jas',
    [firstPrefix + 'Pe?t(?:er)?']: '1Pe',
    [secondPrefix + 'Pe?t(?:er)?']: '2Pe',
    [firstPrefix + 'Jo?h?n']: '1Jn',
    [secondPrefix + 'Jo?h?n']: '2Jn',
    [thirdPrefix + 'Jo?h?n']: '3Jn',
    'Jude?': 'Jud',
    'R(?:e?v|evelation)': 'Rev'
};

// The regex to match book names
// let bibleRegex = '(' + Object.keys(bibleBooks).join('|') + ')';
// // Matches the first chapter:verse, and optionally an endchapter:verse
// bibleRegex += '\\.?\\s*((?:\d{1,3}[:]\\s*\d{1,2}(?:[–—-]\d{1,2}(?:[:]\d{1,2})?)?)';
// // After the first, can leave off the chapter, so then a single verse will match to the last listed chapter
// bibleRegex += '(?:[,;]\\s*(?:(?:\d{1,3}(?:[:]\d{1,2}(?:[–—-]\d{1,2})?))';
// // But don't match a single verse if it is right before a book that has a number before it
// bibleRegex += '|\d{1,3}(?:[–—-]\d{1,2})?(?![,;]\\s*' + books_start_with_num + ')))*)';
// // Add Jude separately because Jude only has 1 chapter, so people usually don't put a chapter with the verse
// bibleRegex += '|(?:Jude?\\s*(\d{1,2}(?:[,;]?\\s*\d{1,2})*))';
// bibleRegex = new RegExp(bibleRegex, 'gi');
// console.log(bibleRegex);

// eslint-disable-next-line max-len
let bibleRegex = /(Gen(?:esis)?|Ex(?:od(?:us)?)?|Le(?:v(?:iticus)?)?|Num(?:b(?:ers)?)?|D(?:t|eut(?:eronomy)?)|Jo(?:s(?:h(?:ua)?)?)?|J(?:dgs?|udg(?:es)?)|Ru?th|(?:1(?:st)?|I|First)\s*Sam(?:uel)?|(?:2(?:nd)?|II|Second)\s*Sam(?:uel)?|(?:1(?:st)?|I|First)\s*K(?:(?:in)?gs)|(?:2(?:nd)?|II|Second)\s*K(?:(?:in)?gs)|(?:1(?:st)?|I|First)\s*Chr(?:on(?:icles)?)?|(?:2(?:nd)?|II|Second)\s*Chr(?:on(?:icles)?)?|Ez(?:ra?)?|Ne(?:h(?:emiah)?)?|Tob(?:it|ias)?|J(?:d?th?|udith)|Est(?:h(?:er)?)?|(?:1(?:st)?|I|First)\s*Mac(?:c(?:abees)?)?|(?:2(?:nd)?|II|Second)\s*Mac(?:c(?:abees)?)?|Jo?b|Ps(?:a(?:lms?)?)?|Pro(?:v(?:erbs)?)?|Ecc(?:les?|lesiastes)?|So(?:S|ng(?:\s*of\s*(?:Sol(?:omon)?|Songs?))?)|Wis(?:dom)?(?:\s*of\s*Sol(?:omon)?)?|Sir(?:ach)?|Bar(?:uch)?|Is(?:a(?:iah)?)?|Jer(?:emiah)?|Lam(?:entations)?|Ez(?:e?k?|ekiel)|Dan(?:iel)?|Hos(?:ea)?|Joel|Amos|Ob(?:ad(?:iah)?)?|Jon(?:ah)?|Mic(?:ah)?|Nah(?:um)?|Hab(?:akkuk)?|Zep(?:h(?:aniah)?)?|Hag(?:gai)?|Zec(?:h(?:ariah)?)?|Mal(?:achi)?|M(?:t|att(?:h(?:ew)?)?)|M(?:k|ark?)|L(?:k|uke?)|Jo?h?n|Acts?|Ro(?:m(?:ans)?)?|(?:1(?:st)?|I|First)\s*Co(?:r(?:inthian(?:s)?)?)?|(?:2(?:nd)?|II|Second)\s*Co(?:r(?:inthian(?:s)?)?)?|Gal(?:atians)?|Eph(?:es(?:ians)?)?|Phil(?:ippians)?|Col(?:ossians)?|(?:1(?:st)?|I|First)\s*Thes(?:s(?:alonians)?)?|(?:2(?:nd)?|II|Second)\s*Thes(?:s(?:alonians)?)?|(?:1(?:st)?|I|First)\s*T(?:i?m?|imothy)|(?:2(?:nd)?|II|Second)\s*T(?:i?m?|imothy)|Titus|Phil(?:em(?:on)?)?|Heb(?:rews?)?|James|(?:1(?:st)?|I|First)\s*Pe?t(?:er)?|(?:2(?:nd)?|II|Second)\s*Pe?t(?:er)?|(?:1(?:st)?|I|First)\s*Jo?h?n|(?:2(?:nd)?|II|Second)\s*Jo?h?n|(?:3(?:rd)?|III|Third)\s*Jo?h?n|Jude?|R(?:e?v|evelation))\.?\s*((?:\d{1,3}[:]\s*\d{1,2}(?:[–—-]\d{1,2}(?:[:]\d{1,2})?)?)(?:[,;]\s*(?:(?:\d{1,3}(?:[:]\d{1,2}(?:[–—-]\d{1,2})?))|\d{1,3}(?:[–—-]\d{1,2})?(?![,;]\s*(?:Sam(?:uel)?|K(?:(?:in)?gs)|Chr(?:on(?:icles)?)?|Mac(?:c|cabees)?|Co(?:r(?:inthians)?)?|Thes(?:s(?:alonians)?)?|T(?:i?m?|imothy)|Pe?t(?:er)?|Jo?h?n))))*)|(?:Jude?\s*(\d{1,2}(?:[,;]?\s*\d{1,2})*))/gi;

/**
 * Given a string, gets the verse components and previous chapter (if it exists)
 *
 * @param {string} verseStr The verse
 * @param {string} prevChap The previous chapter
 * @returns {Array} Each component of the verse, including start chapter and verse, and end chapter and verse
 */
function getVerseFromString(verseStr, prevChap) {
    let startChap, startVerse, endChap, endVerse;
    let [start, end] = verseStr.split(dashes);

    [startChap, startVerse] = start.split(':');
    if (startVerse === undefined) {
        startVerse = startChap;
        startChap = prevChap;
    } else {
        prevChap = startChap;
    }

    if (end !== undefined) {
        [endChap, endVerse] = end.split(':');
        if (endVerse === undefined) {
            endVerse = endChap;
            endChap = startChap;
        } else {
            prevChap = endChap;
        }
    } else {
        endVerse = startVerse;
        endChap = startChap;
    }

    return [startChap, startVerse, endChap, endVerse, prevChap];
}

/**
 * Transform all bible references into links using a TreeWalker
 *
 * @param {string} trans - Which bible translation to use
 * @returns {number} The number of links on the page
 */
function transformBibleReferences(trans) {
    // console.time('TreeWalker');
    // Use a TreeWalker instead of simple replace so we can ignore bible references that are already links
    let treeWalker = document.createTreeWalker(document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // Check for a book of the bible, and that the text isn't already a link
                if (node.textContent.match(bibleRegex) && node.parentElement.closest('a') === null
                    && node.parentElement.closest('.biblePreviewerTooltip') === null) {
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
            if (newNode.contains(prevNode)) {
                nodeList.splice(i, 1);
            }
        }
        if (shouldAdd) nodeList.push(newNode);
    }
    // console.timeEnd('TreeWalker');

    // console.time('Change to links');
    nodeList.forEach(node => {
        // m - original text, b - book, l - verse list match, jv - Jude verse (if applicable)
        node.innerHTML = node.innerHTML.replace(bibleRegex, function (orig, matchedBook, verseListStr, judeVerse) {
            let book = '', actual_trans = trans;
            if (judeVerse === undefined) {
                // TODO: Figure out a more efficient way to do this
                for (let key in bibleBooks) {
                    if (matchedBook.search('^' + key + '$') > -1) {
                        book = bibleBooks[key];
                        // If the book is John, continue searching to verify it isn't 1, 2, 3 John
                        if (book !== 'John')
                            break;
                    }
                }
                if (book === '') {
                    console.error('Couldn\'t match ' + orig);
                    return orig;
                }
                // Change translation if it is a deuterocannonical book and an unsupported translation is selected
                if (!versions_with_deutero.includes(actual_trans) && deutero_books.includes(book)) {
                    actual_trans = DEFAULT_DEUTERO_TRANS;
                }
            } else {
                book = 'Jude';
                verseListStr = judeVerse.split(/[,;]\s*/g);
                for (let i = 0; i < verseListStr.length; i++) {
                    verseListStr[i] = '1:' + verseListStr[i];
                }
                verseListStr = verseListStr.join(',');
            }

            let startChap, startVerse, endChap, endVerse, prevChap = null;
            let refList = [], verseList = verseListStr.split(/[,;]\s*/g);
            let splitText = orig.split(/[,;]/g);
            for (let i = 0; i < verseList.length; i++) {
                [startChap, startVerse, endChap, endVerse, prevChap] = getVerseFromString(verseList[i], prevChap);
                book = book.toUpperCase();
                let directHref = `${BIBLE_DIRECT_URL}${actual_trans}/${book}.${prevChap}?passageId=${book}.${startChap}.${startVerse}`;
                if (startVerse !== endVerse) {
                    directHref += `-${book}.${endChap}.${endVerse}`;
                }
                let apiLink = `${startChap}:${startVerse}-${endChap}:${endVerse}`;
                refList.push('<span class="biblePreviewerContainer">' +
                    `<a class="biblePreviewerLink" href="${directHref}" target="_blank" data-bible-ref="${apiLink}"
                            data-bible-book="${book}" data-bible-trans="${actual_trans}">${splitText[i]}</a></span>`);
            }

            return refList.join(', ');
        });
    });
    // console.timeEnd('Change to links');
    return nodeList.length;
}

/**
 * Sends a request to the bible API for the specified verses
 *
 * @param {string} book - OSIS abbreviation of the book
 * @param {string} startChapter - chapter number
 * @param {string} startVerse - what verse to start reading from
 * @param {string} endChapter - ending chapter number
 * @param {string} endVerse - what verse to end reading at
 * @param {string} translation - Which bible translation to use
 * @param {Function} cb - What to do after the API returns the verse
 */
function sendAPIRequestForVerses(book, startChapter, startVerse, endChapter, endVerse, translation, cb) {
    let requestLink = `${BIBLE_API_BASE_URL}bibles/${translation}/verses/${book}.${startChapter}.${startVerse}-${book}.${endChapter}.${endVerse}`;

    let xhr = new XMLHttpRequest();
    xhr.open('GET', requestLink, true);
    chrome.runtime.sendMessage({contentScriptQuery: 'getVerses', url: requestLink}, response => {
        let res = JSON.parse(response);
        if (res.statusCode >= 300) {
            cb(null, null, res.statusCode);
        } else {
            let verseRef = res.data.reference;
            if (startVerse !== endVerse) {
                verseRef += ` - ${endChapter}:${endVerse}`;
            }
            cb(res.data.content, verseRef, 200);
        }
    });
}

/**
 * Creates the tooltip content for the bible verse
 *
 * @param {object} ref The stored bible verse information
 * @param {string} ref.verse The bible verse (for example 1st Corinthians 1:1)
 * @param {string} ref.text The text of the bible verse
 * @param {string} ref.translation The translation of the verse
 * @returns {string} The html content that the tooltip will use
 */
function createTooltipContent({verse, text, translation}) {
    let htmlString = '<div class="biblePreviewerTooltip" role="tooltip">';
    if (verse) {
        htmlString += `<div class="bpHeaderBar"><div class="bpVerse">${verse}</div>`;
        if (translation) {
            htmlString += `<div class="bpTranslation">${translation}</div>`;
        }
        htmlString += '</div>';
    }
    htmlString += `<div class="bpTooltipContent">${text}</div></div>`;
    return htmlString;
}

/**
 * Create the tooltip popups that will show the verse text above the link on hover
 */
function createTooltips() {
    tippy('.biblePreviewerLink', {
        delay: [250, 750],
        duration: 250,
        arrow: true,
        interactive: true,
        content: function(reference) {
            const bibleBook = reference.getAttribute('data-bible-book');
            const bibleRef = reference.getAttribute('data-bible-ref');
            const fullRef = `${bibleBook} ${bibleRef}`;
            if (bibleVerseDict[fullRef] === undefined) {
                return createTooltipContent({text: 'Loading'});
            } else {
                // If there is another link to the same verse on the page, then set that verse text
                return createTooltipContent(bibleVerseDict[fullRef]);
            }
        },
        onShow: function(instance) {
            const reference = instance.reference;
            const bibleBook = reference.getAttribute('data-bible-book');
            const bibleRef = reference.getAttribute('data-bible-ref');
            const bibleTrans = reference.getAttribute('data-bible-trans');

            const fullRef = `${bibleBook} ${bibleRef}`;
            if (bibleVerseDict[fullRef] === undefined) {
                // eslint-disable-next-line comma-spacing
                let [startChap, startVerse, endChap, endVerse,] = getVerseFromString(bibleRef, null);
                sendAPIRequestForVerses(bibleBook, startChap, startVerse, endChap, endVerse, bibleTrans, function (verseText, verseRef, status) {
                    if (verseText && status === 200) {
                        // Store into a dictionary for quick access later
                        bibleVerseDict[fullRef] = {
                            text: verseText,
                            verse: verseRef,
                            // The translation that comes back from the API is just a hash, so don't display that
                            translation: ''
                        };
                        instance.setContent(createTooltipContent(bibleVerseDict[fullRef]));
                    } else if (status === 404) {
                        instance.setContent(createTooltipContent({text: 'Verse does not exist'}));
                        bibleVerseDict[fullRef] = 'Verse does not exist';
                    } else if (status === 0) {
                        instance.setContent(createTooltipContent({text: "Request couldn't be completed, try again later"}));
                    } else {
                        instance.setContent(createTooltipContent({text: 'Try again later'}));
                    }
                });
            } else {
                // If there is another link to the same verse on the page, then set that verse text
                instance.setContent(createTooltipContent(bibleVerseDict[fullRef]));
            }
        },

        allowHTML: true
    });
}

/**
 * Initializes the app
 *
 * @param {string} translation Which bible translation to use
 */
function initBiblePreviewer(translation) {
    let node_length = transformBibleReferences(translation);
    if (node_length) {
        // console.time('Create Tooltips');
        createTooltips();
        // console.timeEnd('Create Tooltips');
    }
}
// Starts the app only once the page has completely finished loading
chrome.runtime.onMessage.addListener(function (request) {
    if (request.translation === undefined) {
        request.translation = DEFAULT_TRANS;
    }

    initBiblePreviewer(request.translation);
});

// let xhr = new XMLHttpRequest();
// xhr.open('GET', ESV_API_BASE_URL, true);
// xhr.setRequestHeader('Authorization', 'Token ' + ESV_API_KEY);
// xhr.onreadystatechange = function () {
//     if (xhr.readyState === 4 && xhr.status === 200) {
//         let res = JSON.parse(xhr.responseText).response;
//         console.log(res)
//     } else {
//         console.log(xhr.status);
//     }
// };
// xhr.send();
