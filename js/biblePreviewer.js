// TODO: Add font size selector to the option panel
// TODO: Add version selector to the popup.html
// TODO: Add turning off on specific websites to popup.html
import '../css/biblePreviewer.scss';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'; // optional for styling

// const ESV_API_KEY = '52ca2a57f09495325d251464d417edc1cfe94834';

const LOADING_TEXT = 'Loading';
const VERSE_NO_EXIST_TEXT = 'Verse does not exist';
const BAD_REQUEST_TEXT = 'Request couldn\'t be completed, try again later';
const TRY_AGAIN_TEXT = 'Try again later';

const BIBLE_API_BASE_URL = 'https://api.scripture.api.bible/v1/';
// const ESV_API_BASE_URL = `https://api.esv.org/v3/passage/text/?q=`;
const DEFAULT_TRANS = '9879dbb7cfe39e4d-04';
const DEFAULT_LANGUAGE = 'eng';
// The translation to use if the version selected doesn't have the Catholic deuterocannonical books
const DEFAULT_DEUTERO_TRANS = '9879dbb7cfe39e4d-02';
const BIBLE_DIRECT_URL = 'global.bible/bible/';

const versions_with_deutero = [DEFAULT_DEUTERO_TRANS];

/**
 * The Z index to give tooltips that are no longer being hovered
 */
const INACTIVE_ZINDEX = 400;
/**
 * The Z index to give the tooltip that is being actively hovered
 */
const ACTIVE_ZINDEX = 500;

/**
 * Whether to generate the bible reference matching regex, or use the hardcoded one.
 * For production, this should be set to false.
 */
const GENERATE_REGEX = false;

const ONE_MAC_TAG = '1Ma';
const TWO_MAC_TAG = '2Ma';
const WISDOM_TAG = 'Wis';
const SIRACH_TAG = 'Sir';
const BARUCH_TAG = 'Bar';
const TOBIT_TAG = 'Tob';
const JUDITH_TAG = 'Jdt';

const SAMUEL_REG = 'Sa?m(?:uel)?';
const KINGS_REG = 'K(?:(?:in)?gs)';
const CHRON_REG = 'Chr(?:on(?:icles)?)?';
const MACC_REG = 'Mac(?:c(?:abees)?)?';
const CORINTH_REG = 'Co(?:r(?:inthian(?:s)?)?)?';
const JUDE_REG = 'Jude?';
const THES_REG = 'Thes(?:s(?:alonians)?)?';
const TIM_REG = 'T(?:i?m?|imothy)';
const PETER_REG = 'Pe?t(?:er)?';
const JOHN_REG = 'Jo?h?n';

const deutero_books = [ONE_MAC_TAG, TWO_MAC_TAG, WISDOM_TAG, SIRACH_TAG, BARUCH_TAG, TOBIT_TAG, JUDITH_TAG];
const books_start_with_num = `(?:${SAMUEL_REG}|${KINGS_REG}|${CHRON_REG}|${MACC_REG}|${CORINTH_REG}|${THES_REG}|${TIM_REG}|${PETER_REG}|${JOHN_REG})`;
const firstPrefix = '(?:1(?:st)?|I|First)\\s*';
const secondPrefix = '(?:2(?:nd)?|II|Second)\\s*';
const thirdPrefix = '(?:3(?:rd)?|III|Third)\\s*';

/**
 * Contains different dashes that might be used in a bible reference
 */
const DASHES_STR = '[–—-]';
/**
 * @see DASHES_STR
 */
const DASHES_REG = new RegExp(DASHES_STR);

const JUDE_BOOK_ID = 'Jud';

/**
 * Lookup dictionary for verses
 */
let bibleVerseDict = {};

// I make a lot of the () non-capturing, so I can capture the chapter/verse numbers more easily later
const bibleBooks = {
    'Ge?n(?:esis)?': 'Gen',
    'Ex(?:od(?:us)?)?': 'Exo',
    'Le(?:v(?:iticus)?)?': 'Lev',
    'Nu?m(?:b(?:ers)?)?': 'Num',
    'D(?:t|eut(?:eronomy)?)': 'Deu',
    'Jo(?:s(?:h(?:ua)?)?)?': 'Jos',
    'J(?:dgs?|udg(?:es)?)': 'Jdg',
    'Ru?th': 'Rut',
    [firstPrefix + SAMUEL_REG]: '1Sa',
    [secondPrefix + SAMUEL_REG]: '2Sa',
    [firstPrefix + KINGS_REG]: '1Ki',
    [secondPrefix + KINGS_REG]: '2Ki',
    [firstPrefix + CHRON_REG]: '1Ch',
    [secondPrefix + CHRON_REG]: '2Ch',
    'Ez(?:ra?)': 'Ezr',
    'Ne(?:h(?:emiah)?)?': 'Neh',
    'Tob(?:it|ias)?': TOBIT_TAG,
    'J(?:d?th?|udith)': JUDITH_TAG,
    'Est(?:h(?:er)?)?': 'Est',
    [firstPrefix + MACC_REG]: ONE_MAC_TAG,
    [secondPrefix + MACC_REG]: TWO_MAC_TAG,
    'Jo?b': 'Job',
    'Ps(?:a(?:lms?)?)?': 'Psa',
    'Pro(?:v(?:erbs)?)?': 'Pro',
    'Ecc(?:les?|lesiastes)?': 'Ecc',
    'So(?:S|ng(?:\\s*of\\s*(?:Sol(?:omon)?|Songs?))?)': 'Sng',
    'Wis(?:dom)?(?:\\s*of\\s*Sol(?:omon)?)?': WISDOM_TAG,
    'Sir(?:ach)?': SIRACH_TAG,
    'Bar(?:uch)?': BARUCH_TAG,
    'Is(?:a(?:iah)?)?': 'Isa',
    'Jer(?:emiah)?': 'Jer',
    'Lam(?:entations)?': 'Lam',
    'Ez(?:e?k?|ekiel)?': 'Ezk',
    'Da?n(?:iel)?': 'Dan',
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
    [JOHN_REG]: 'Jhn',
    'Acts?': 'Act',
    'Ro(?:m(?:ans)?)?': 'Rom',
    [firstPrefix + CORINTH_REG]: '1Co',
    [secondPrefix + CORINTH_REG]: '2Co',
    'Gal(?:atians)?': 'Gal',
    'Eph(?:es(?:ians)?)?': 'Eph',
    'Phil(?:ippians)?': 'Php',
    'Col(?:ossians)?': 'Col',
    [firstPrefix + THES_REG]: '1Th',
    [secondPrefix + THES_REG]: '2Th',
    [firstPrefix + TIM_REG]: '1Ti',
    [secondPrefix + TIM_REG]: '2Ti',
    'Titus': 'Tit',
    'Phil(?:em(?:on)?)?': 'Phm',
    'Heb(?:rews?)?': 'Heb',
    'Ja(?:me)?s': 'Jas',
    [firstPrefix + PETER_REG]: '1Pe',
    [secondPrefix + PETER_REG]: '2Pe',
    [firstPrefix + JOHN_REG]: '1Jn',
    [secondPrefix + JOHN_REG]: '2Jn',
    [thirdPrefix + JOHN_REG]: '3Jn',
    [JUDE_REG]: JUDE_BOOK_ID,
    'R(?:e?v|evelation)': 'Rev'
};

let bibleRegex;

if (GENERATE_REGEX) {
    // The regex to match book names
    bibleRegex = `(${Object.keys(bibleBooks).join('|')})`;
    // Matches the first chapter:verse, and optionally an endchapter:verse
    bibleRegex += `\\.?\\s*((?:\\d{1,3}[:]\\s*\\d{1,2}(?:${DASHES_STR}\\d{1,2}(?:[:]\\d{1,2})?)?)`;
    // After the first, can leave off the chapter, so then a single verse will match to the last listed chapter
    bibleRegex += `(?:[,;]\\s*(?:(?:\\d{1,3}(?:[:]\\d{1,2}(?:${DASHES_STR}\\d{1,2})?)?`;
    // But don't match a single verse if it is right before a book that has a number before it
    bibleRegex += `(?!\\s*${books_start_with_num}))))*)`;
    // Add Jude separately because Jude only has 1 chapter, so people usually don't put a chapter with the verse
    bibleRegex += `|(?:${JUDE_REG}\\s*(\\d{1,2}(?:[,;]?\\s*\\d{1,2})*))`;
    bibleRegex = new RegExp(bibleRegex, 'gi');
    console.log(bibleRegex);
} else {
    // eslint-disable-next-line max-len
    bibleRegex = /(Ge?n(?:esis)?|Ex(?:od(?:us)?)?|Le(?:v(?:iticus)?)?|Nu?m(?:b(?:ers)?)?|D(?:t|eut(?:eronomy)?)|Jo(?:s(?:h(?:ua)?)?)?|J(?:dgs?|udg(?:es)?)|Ru?th|(?:1(?:st)?|I|First)\s*Sa?m(?:uel)?|(?:2(?:nd)?|II|Second)\s*Sa?m(?:uel)?|(?:1(?:st)?|I|First)\s*K(?:(?:in)?gs)|(?:2(?:nd)?|II|Second)\s*K(?:(?:in)?gs)|(?:1(?:st)?|I|First)\s*Chr(?:on(?:icles)?)?|(?:2(?:nd)?|II|Second)\s*Chr(?:on(?:icles)?)?|Ez(?:ra?)|Ne(?:h(?:emiah)?)?|Tob(?:it|ias)?|J(?:d?th?|udith)|Est(?:h(?:er)?)?|(?:1(?:st)?|I|First)\s*Mac(?:c(?:abees)?)?|(?:2(?:nd)?|II|Second)\s*Mac(?:c(?:abees)?)?|Jo?b|Ps(?:a(?:lms?)?)?|Pro(?:v(?:erbs)?)?|Ecc(?:les?|lesiastes)?|So(?:S|ng(?:\s*of\s*(?:Sol(?:omon)?|Songs?))?)|Wis(?:dom)?(?:\s*of\s*Sol(?:omon)?)?|Sir(?:ach)?|Bar(?:uch)?|Is(?:a(?:iah)?)?|Jer(?:emiah)?|Lam(?:entations)?|Ez(?:e?k?|ekiel)?|Da?n(?:iel)?|Hos(?:ea)?|Joel|Amos|Ob(?:ad(?:iah)?)?|Jon(?:ah)?|Mic(?:ah)?|Nah(?:um)?|Hab(?:akkuk)?|Zep(?:h(?:aniah)?)?|Hag(?:gai)?|Zec(?:h(?:ariah)?)?|Mal(?:achi)?|M(?:t|att(?:h(?:ew)?)?)|M(?:k|ark?)|L(?:k|uke?)|Jo?h?n|Acts?|Ro(?:m(?:ans)?)?|(?:1(?:st)?|I|First)\s*Co(?:r(?:inthian(?:s)?)?)?|(?:2(?:nd)?|II|Second)\s*Co(?:r(?:inthian(?:s)?)?)?|Gal(?:atians)?|Eph(?:es(?:ians)?)?|Phil(?:ippians)?|Col(?:ossians)?|(?:1(?:st)?|I|First)\s*Thes(?:s(?:alonians)?)?|(?:2(?:nd)?|II|Second)\s*Thes(?:s(?:alonians)?)?|(?:1(?:st)?|I|First)\s*T(?:i?m?|imothy)|(?:2(?:nd)?|II|Second)\s*T(?:i?m?|imothy)|Titus|Phil(?:em(?:on)?)?|Heb(?:rews?)?|Ja(?:me)?s|(?:1(?:st)?|I|First)\s*Pe?t(?:er)?|(?:2(?:nd)?|II|Second)\s*Pe?t(?:er)?|(?:1(?:st)?|I|First)\s*Jo?h?n|(?:2(?:nd)?|II|Second)\s*Jo?h?n|(?:3(?:rd)?|III|Third)\s*Jo?h?n|Jude?|R(?:e?v|evelation))\.?\s*((?:\d{1,3}[:]\s*\d{1,2}(?:[–—-]\d{1,2}(?:[:]\d{1,2})?)?)(?:[,;]\s*(?:(?:\d{1,3}(?:[:]\d{1,2}(?:[–—-]\d{1,2})?)?(?!\s*(?:Sa?m(?:uel)?|K(?:(?:in)?gs)|Chr(?:on(?:icles)?)?|Mac(?:c(?:abees)?)?|Co(?:r(?:inthian(?:s)?)?)?|Thes(?:s(?:alonians)?)?|T(?:i?m?|imothy)|Pe?t(?:er)?|Jo?h?n)))))*)|(?:Jude?\s*(\d{1,2}(?:[,;]?\s*\d{1,2})*))/gi;
}

/**
 * Given a string, gets the verse components and previous chapter (if it exists)
 *
 * @param {string} verseStr The verse
 * @param {string} prevChap The previous chapter
 * @returns {Array} Each component of the verse, including start chapter and verse, and end chapter and verse
 */
function getVerseFromString(verseStr, prevChap) {
    let startChap, startVerse, endChap, endVerse;
    let [start, end] = verseStr.split(DASHES_REG);

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
 * Gets all the document nodes that need to be transformed into a link
 * Uses a TreeWalker instead of simple replace so we can ignore bible references that are already links
 *
 * @param {Element} elem - The DOM node to search over
 * @returns {Array} The list of node elements to transform to bible links
 */
function getNodesToTransform(elem) {
    let treeWalker = document.createTreeWalker(elem,
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
    return nodeList;
}

/**
 * Transform all bible references into links using a TreeWalker
 *
 * @param {Element} elem - The DOM node to search over
 * @param {string} trans - Which bible translation to use
 * @param {string} language - Which language is selected
 * @returns {number} The number of links on the page
 */
function transformBibleReferences(elem, trans, language) {
    let nodeList = getNodesToTransform(elem);

    nodeList.forEach(node => {
        node.innerHTML = node.innerHTML.replace(bibleRegex, function (orig, matchedBook, verseListStr, judeVerse) {
            let book = '';
            let actual_trans = trans;
            if (judeVerse === undefined) {
                // TODO: Figure out a more efficient way to do this
                for (let key in bibleBooks) {
                    if (matchedBook.search(`^${key}$`) > -1) {
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
                book = JUDE_BOOK_ID;
                verseListStr = judeVerse.split(/[,;]\s*/g);
                for (let i = 0; i < verseListStr.length; i++) {
                    verseListStr[i] = '1:' + verseListStr[i];
                }
                verseListStr = verseListStr.join(',');
            }

            let startChap, startVerse, endChap, endVerse, prevChap = '';
            let refList = [];
            const verseList = verseListStr.split(/[,;]\s*/g);
            const splitText = orig.split(/[,;]/g);
            for (let i = 0; i < verseList.length; i++) {
                [startChap, startVerse, endChap, endVerse, prevChap] = getVerseFromString(verseList[i], prevChap);
                book = book.toUpperCase();
                let directHref = `https://${language}.${BIBLE_DIRECT_URL}${actual_trans}
/${book}.${prevChap}?passageId=${book}.${startChap}.${startVerse}`;
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
 * @param {string} [ref.verse] The bible verse (for example 1st Corinthians 1:1)
 * @param {string} ref.text The text of the bible verse
 * @param {string} [ref.translation] The translation of the verse
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
 *
 * @param {Element} elem The element to search under to create the tooltips for
 */
function createTooltips(elem) {
    tippy(elem.querySelectorAll('.biblePreviewerLink'), {
        delay: [250, 750],
        duration: 250,
        arrow: true,
        interactive: true,
        onTrigger: function (instance) {
            instance.setProps({zIndex: ACTIVE_ZINDEX});
        },
        onUntrigger: function (instance) {
            instance.setProps({zIndex: INACTIVE_ZINDEX});
        },
        content: function (reference) {
            const bibleBook = reference.getAttribute('data-bible-book');
            const bibleRef = reference.getAttribute('data-bible-ref');
            const fullRef = `${bibleBook} ${bibleRef}`;
            if (bibleVerseDict[fullRef] === undefined) {
                return createTooltipContent({text: LOADING_TEXT});
            } else {
                // If there is another link to the same verse on the page, then set that verse text
                return createTooltipContent(bibleVerseDict[fullRef]);
            }
        },
        onShow: function (instance) {
            instance.setProps({zIndex: ACTIVE_ZINDEX});

            const reference = instance.reference;
            const bibleBook = reference.getAttribute('data-bible-book');
            const bibleRef = reference.getAttribute('data-bible-ref');
            const bibleTrans = reference.getAttribute('data-bible-trans');

            const fullRef = `${bibleBook} ${bibleRef}`;
            if (bibleVerseDict[fullRef] === undefined) {
                let [startChap, startVerse, endChap, endVerse] = getVerseFromString(bibleRef, '');
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
                        instance.setContent(createTooltipContent({text: VERSE_NO_EXIST_TEXT}));
                        bibleVerseDict[fullRef] = 'Verse does not exist';
                    } else if (status === 0) {
                        instance.setContent(createTooltipContent({text: BAD_REQUEST_TEXT}));
                    } else {
                        instance.setContent(createTooltipContent({text: TRY_AGAIN_TEXT}));
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
 * Performs the link transformation and tooltip generation
 *
 * @param {Element} elem The element to search under to create the tooltips for
 * @param {object} request The request object
 */
function addLinks(elem, request) {
    let node_length = transformBibleReferences(elem, request.translation, request.language);
    if (node_length) {
        // console.time('Create Tooltips');
        createTooltips(elem);
        // console.timeEnd('Create Tooltips');
    }
}

// Starts the app only once the page has completely finished loading
chrome.runtime.onMessage.addListener(function (request) {
    if (request.translation === undefined) {
        request.translation = DEFAULT_TRANS;
    }
    if (request.language === undefined) {
        request.language = DEFAULT_LANGUAGE;
    }

    let isCypress = false;
    for (let i = 0; i < document.scripts.length; i++) {
        if (document.scripts[i].src.match(/localhost:\d+\/__cypress\/runner\/cypress_runner.js/)) {
            isCypress = true;
            break;
        }
    }

    if (isCypress) {
        addLinks(document.body, request);

        let interval = setInterval(() => {
            const cypressFrame = document.querySelector('iframe').contentWindow.document.querySelector('#bible-previewer-cypress-test-container');
            if (cypressFrame) {
                addLinks(cypressFrame, request);
                clearInterval(interval);
            }
        }, 500);
    } else {
        addLinks(document.body, request);
    }
});
