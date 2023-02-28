import '../css/biblePreviewer.scss';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'; // optional for styling


const LOADING_TEXT = 'Loading';
const VERSE_NO_EXIST_TEXT = 'Verse does not exist';
const BAD_REQUEST_TEXT = "Request couldn't be completed, try again later";
const TRY_AGAIN_TEXT = 'Try again later';

const BIBLE_API_BASE_URL = 'https://api.scripture.api.bible/v1/';
const DEFAULT_TRANS = '9879dbb7cfe39e4d-04';
const DEFAULT_LANGUAGE = 'eng';
// The translation to use if the version selected doesn't have the Catholic deuterocannonical books
const DEFAULT_DEUTERO_TRANS = '9879dbb7cfe39e4d-02';
const BIBLE_DIRECT_URL = 'global.bible/bible/';

const versions_with_deutero = [DEFAULT_DEUTERO_TRANS];

const BIBLE_PREVIEWER_CONTAINER_CLASS = 'biblePreviewerContainer';
const BIBLE_PREVIEWER_LINK_CLASS = 'biblePreviewerLink';

const BIBLE_REF_LINK_PROP = 'data-bible-ref';
const BIBLE_BOOK_LINK_PROP = 'data-bible-book';
const BIBLE_TRANS_LINK_PROP = 'data-bible-trans';

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
const KINGS_REG = 'K(?:in)?gs';
const CHRON_REG = 'Chr(?:on(?:icles)?)?';
const MACC_REG = 'Mac(?:c(?:abees)?)?';
const CORINTH_REG = 'Co(?:r(?:inthians?)?)?';
const JUDE_REG = 'Jude?';
const THES_REG = 'Thes(?:s(?:alonians)?)?';
const TIM_REG = 'T(?:imothy|i|m|im)';
const PETER_REG = 'Pe?t(?:er)?';
const JOHN_REG = 'Jo?h?n';

const deutero_books = [ONE_MAC_TAG, TWO_MAC_TAG, WISDOM_TAG, SIRACH_TAG, BARUCH_TAG, TOBIT_TAG, JUDITH_TAG];
const books_start_with_num = `(?:${SAMUEL_REG}|${KINGS_REG}|${CHRON_REG}|${MACC_REG}|${CORINTH_REG}|${THES_REG}|${TIM_REG}|${PETER_REG}|${JOHN_REG})`;
const firstPrefix = '(?:1(?:st)?|I|First)\\s*';
const secondPrefix = '(?:2(?:nd)?|II|Second)\\s*';
const thirdPrefix = '(?:3(?:rd)?|III|Third)\\s*';

/**
 * Contains different dashes that might be used in a bible reference
 *
 * Note: Order matters where this is used, so the Regex parser doesn't interpret a dash as a character range
 */
const DASHES_STR = '–—-';
/**
 * @see DASHES_STR
 */
const DASHES_REG = new RegExp(`[${DASHES_STR}]`);

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
    'Ezra?': 'Ezr',
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
    'Ez(?:e?k?|ekiel)': 'Ezk',
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
    // Matches a required start chapter and verse, then matches an optional end chapter and verse, with lists also supported
    bibleRegex += `\\.?\\s*(\\d{1,3}:\\s*\\d{1,3}(?:[,:${DASHES_STR}]\\s*\\d{1,3}`;
    // But don't match a single verse if it is right before a book that has a number before it
    bibleRegex += `(?!\\s*${books_start_with_num}))*)`;
    // Add Jude separately because Jude only has 1 chapter, so people usually don't put a chapter with the verse
    bibleRegex += `|${JUDE_REG}\\s*(\\d{1,2}(?:[,;]?\\s*\\d{1,2})*)`;
    bibleRegex = new RegExp(bibleRegex, 'gi');
    console.log(bibleRegex);
} else {
    // eslint-disable-next-line max-len, regexp/optimal-lookaround-quantifier
    bibleRegex = /(Ge?n(?:esis)?|Ex(?:od(?:us)?)?|Le(?:v(?:iticus)?)?|Nu?m(?:b(?:ers)?)?|D(?:t|eut(?:eronomy)?)|Jo(?:s(?:h(?:ua)?)?)?|J(?:dgs?|udg(?:es)?)|Ru?th|(?:1(?:st)?|I|First)\s*Sa?m(?:uel)?|(?:2(?:nd)?|II|Second)\s*Sa?m(?:uel)?|(?:1(?:st)?|I|First)\s*K(?:in)?gs|(?:2(?:nd)?|II|Second)\s*K(?:in)?gs|(?:1(?:st)?|I|First)\s*Chr(?:on(?:icles)?)?|(?:2(?:nd)?|II|Second)\s*Chr(?:on(?:icles)?)?|Ezra?|Ne(?:h(?:emiah)?)?|Tob(?:it|ias)?|J(?:d?th?|udith)|Est(?:h(?:er)?)?|(?:1(?:st)?|I|First)\s*Mac(?:c(?:abees)?)?|(?:2(?:nd)?|II|Second)\s*Mac(?:c(?:abees)?)?|Jo?b|Ps(?:a(?:lms?)?)?|Pro(?:v(?:erbs)?)?|Ecc(?:les?|lesiastes)?|So(?:S|ng(?:\s*of\s*(?:Sol(?:omon)?|Songs?))?)|Wis(?:dom)?(?:\s*of\s*Sol(?:omon)?)?|Sir(?:ach)?|Bar(?:uch)?|Is(?:a(?:iah)?)?|Jer(?:emiah)?|Lam(?:entations)?|Ez(?:e?k?|ekiel)|Da?n(?:iel)?|Hos(?:ea)?|Joel|Amos|Ob(?:ad(?:iah)?)?|Jon(?:ah)?|Mic(?:ah)?|Nah(?:um)?|Hab(?:akkuk)?|Zep(?:h(?:aniah)?)?|Hag(?:gai)?|Zec(?:h(?:ariah)?)?|Mal(?:achi)?|M(?:t|att(?:h(?:ew)?)?)|M(?:k|ark?)|L(?:k|uke?)|Jo?h?n|Acts?|Ro(?:m(?:ans)?)?|(?:1(?:st)?|I|First)\s*Co(?:r(?:inthians?)?)?|(?:2(?:nd)?|II|Second)\s*Co(?:r(?:inthians?)?)?|Gal(?:atians)?|Eph(?:es(?:ians)?)?|Phil(?:ippians)?|Col(?:ossians)?|(?:1(?:st)?|I|First)\s*Thes(?:s(?:alonians)?)?|(?:2(?:nd)?|II|Second)\s*Thes(?:s(?:alonians)?)?|(?:1(?:st)?|I|First)\s*T(?:imothy|i?m?)|(?:2(?:nd)?|II|Second)\s*T(?:imothy|i?m?)|Titus|Phil(?:em(?:on)?)?|Heb(?:rews?)?|Ja(?:me)?s|(?:1(?:st)?|I|First)\s*Pe?t(?:er)?|(?:2(?:nd)?|II|Second)\s*Pe?t(?:er)?|(?:1(?:st)?|I|First)\s*Jo?h?n|(?:2(?:nd)?|II|Second)\s*Jo?h?n|(?:3(?:rd)?|III|Third)\s*Jo?h?n|Jude?|R(?:e?v|evelation))\.?\s*(\d{1,3}:\s*\d{1,3}(?:[,:–—-]\s*\d{1,3}(?!\s*(?:Sa?m(?:uel)?|K(?:in)?gs|Chr(?:on(?:icles)?)?|Mac(?:c(?:abees)?)?|Co(?:r(?:inthians?)?)?|Thes(?:s(?:alonians)?)?|T(?:imothy|i?m?)|Pe?t(?:er)?|Jo?h?n)))*)|Jude?\s*(\d{1,2}(?:[,;]?\s*\d{1,2})*)/gi;
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
 * Uses a TreeWalker instead of simple replace, so we can handle links in a special way.
 *
 * @param {Element} elem - The DOM node to search over
 * @returns {Array<Node>} The list of node elements to transform to bible links
 */
function getNodesToTransform(elem) {
    let treeWalker = document.createTreeWalker(elem,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // Check for a book of the bible, and make sure this text node isn't already in a link
                if (node.textContent.match(bibleRegex)
                    && node.parentElement.classList.contains(BIBLE_PREVIEWER_LINK_CLASS) === false
                    && node.parentElement.closest(BIBLE_PREVIEWER_LINK_CLASS) === null) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
            }
        }
    );

    let nodeList = [];
    // Return the list of nodes instead of the tree walker, because returning the tree walker
    // messes with the iteration through the walker for some reason.
    while (treeWalker.nextNode()) {
        nodeList.push(treeWalker.currentNode);
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
    const translationHasDeuteroBooks = versions_with_deutero.includes(trans);

    for (const node of nodeList) {
        const renderNode = document.createElement('span');
        renderNode.innerHTML = node.textContent.replace(bibleRegex, function (orig, matchedBook, verseListStr, judeVerse) {
            let book = '';
            let actual_trans = trans;
            if (judeVerse === undefined) {
                // TODO: Figure out a more efficient way to do this
                for (let key in bibleBooks) {
                    if (matchedBook.search(`^${key}$`) > -1) {
                        book = bibleBooks[key];
                        // If the book is John, continue searching to verify it isn't 1, 2, 3 John
                        if (book !== 'John') {
                            break;
                        }
                    }
                }
                if (book === '') {
                    console.error("Couldn't match " + orig);
                    return orig;
                }
                // Change translation if it is a deuterocannonical book and an unsupported translation is selected
                if (!translationHasDeuteroBooks && deutero_books.includes(book)) {
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
                let linkElem;
                if (node.parentElement.tagName === 'A' || node.parentElement.closest('a') !== null) {
                    // Just create a span so that the original link is not modified
                    linkElem = document.createElement('span');
                } else {
                    linkElem = document.createElement('a');
                    linkElem.href = `https://${language}.${BIBLE_DIRECT_URL}${actual_trans}
/${book}.${prevChap}?passageId=${book}.${startChap}.${startVerse}`;
                    if (startVerse !== endVerse) {
                        linkElem.href += `-${book}.${endChap}.${endVerse}`;
                    }
                }
                const containerElem = document.createElement('span');
                containerElem.className = BIBLE_PREVIEWER_CONTAINER_CLASS;
                linkElem.className = BIBLE_PREVIEWER_LINK_CLASS;
                linkElem.textContent = splitText[i];
                linkElem.setAttribute(BIBLE_REF_LINK_PROP, `${startChap}:${startVerse}-${endChap}:${endVerse}`);
                linkElem.setAttribute(BIBLE_BOOK_LINK_PROP, book);
                linkElem.setAttribute(BIBLE_TRANS_LINK_PROP, actual_trans);
                containerElem.appendChild(linkElem);
                refList.push(containerElem.outerHTML);
            }

            return refList.join(', ');
        });

        node.replaceWith(...renderNode.childNodes);
    }

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
 * Creates an HTML element with the specified attributes
 *
 * @param {string} elemName The tag name of the HTML element to create (such as div)
 * @param {Object<string, string>} paramDict The dictionary of attributes to set
 * @returns {HTMLElement} The HTML element
 */
function createHtmlElement(elemName, paramDict) {
    const elem = document.createElement(elemName);
    for (const [key, val] of Object.entries(paramDict)) {
        if (['innerHTML', 'innerText'].indexOf(key) >= 0) {
            elem[key] = val;
        } else {
            elem.setAttribute(key, val);
        }
    }
    return elem;
}

/**
 * Creates the tooltip content for the bible verse
 *
 * @param {object} ref The stored bible verse information
 * @param {string} [ref.verse] The bible verse (for example 1st Corinthians 1:1)
 * @param {string} ref.text The text of the bible verse
 * @param {string} [ref.translation] The translation of the verse
 * @returns {HTMLElement} The html content that the tooltip will use
 */
function createTooltipContent({verse, text, translation}) {
    const containerElem = createHtmlElement('div', {'class': 'biblePreviewerTooltip', 'role': 'tooltip'});
    if (verse) {
        const headerElem = createHtmlElement('div', {'class': 'bpHeaderBar'});
        headerElem.appendChild(createHtmlElement('div', {'class': 'bpVerse', 'innerText': verse}));
        if (translation) {
            headerElem.appendChild(createHtmlElement('div', {'class': 'bpTranslation', 'innerText': translation}));
        }
        containerElem.appendChild(headerElem);
    }
    containerElem.appendChild(createHtmlElement('div', {'class': 'bpTooltipContent', 'innerHTML': text}));
    return containerElem;
}

/**
 * Create the tooltip popups that will show the verse text above the link on hover
 *
 * @param {Element} elem The element to search under to create the tooltips for
 */
function createTooltips(elem) {
    tippy(elem.querySelectorAll(`.${BIBLE_PREVIEWER_LINK_CLASS}`), {
        delay: [250, 750],
        duration: 250,
        arrow: true,
        interactive: true,
        allowHTML: true,
        onTrigger: function (instance) {
            instance.setProps({zIndex: ACTIVE_ZINDEX});
        },
        onUntrigger: function (instance) {
            instance.setProps({zIndex: INACTIVE_ZINDEX});
        },
        content: function (reference) {
            const bibleBook = reference.getAttribute(BIBLE_BOOK_LINK_PROP);
            const bibleRef = reference.getAttribute(BIBLE_REF_LINK_PROP);
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
            const bibleBook = reference.getAttribute(BIBLE_BOOK_LINK_PROP);
            const bibleRef = reference.getAttribute(BIBLE_REF_LINK_PROP);
            const bibleTrans = reference.getAttribute(BIBLE_TRANS_LINK_PROP);

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
                        bibleVerseDict[fullRef] = {text: VERSE_NO_EXIST_TEXT};
                        instance.setContent(createTooltipContent(bibleVerseDict[fullRef]));
                    } else if (status === 400) {
                        instance.setContent(createTooltipContent({text: BAD_REQUEST_TEXT}));
                        delete bibleVerseDict[fullRef];
                    } else {
                        instance.setContent(createTooltipContent({text: TRY_AGAIN_TEXT}));
                        delete bibleVerseDict[fullRef];
                    }
                });
            } else {
                // If there is another link to the same verse on the page, then set that verse text
                instance.setContent(createTooltipContent(bibleVerseDict[fullRef]));
            }
        }
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
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.translation === undefined) {
        request.translation = DEFAULT_TRANS;
    }
    if (request.language === undefined) {
        request.language = DEFAULT_LANGUAGE;
    }

    let isCypress = false;
    for (const element of document.scripts) {
        if (element.src.match(/localhost:\d+\/__cypress\/runner\/cypress_runner.js/)) {
            isCypress = true;
            break;
        }
    }

    addLinks(document.body, request);

    if (isCypress) {
        let interval = setInterval(() => {
            const cypressFrame = document.querySelector('iframe').contentWindow.document.querySelector('#bible-previewer-cypress-test-container');
            if (cypressFrame) {
                addLinks(cypressFrame, request);
                clearInterval(interval);
            }
        }, 500);
    }

    // Call sendResponse so the message passer knows that the request has finished
    sendResponse();
});
