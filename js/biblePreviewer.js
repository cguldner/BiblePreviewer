import '../css/biblePreviewer.scss';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'; // optional for styling
import {getVerseFromString, splitVerseListString} from './verseParser.mjs';
import {bibleRegex, deuteroBooks, JUDE_BOOK_ID, getMatchedBookId} from './bibleBooks.mjs';


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

const versions_with_deutero = new Set([DEFAULT_DEUTERO_TRANS]);

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
 * Lookup dictionary for verses
 */
let bibleVerseDict = {};

/**
 * Gets all the document nodes that need to be transformed into a link
 * Uses a TreeWalker instead of simple replace, so we can handle links in a special way.
 * @param {Element} element - The DOM node to search over
 * @returns {Array<Node>} The list of node elements to transform to bible links
 */
function getNodesToTransform(element) {
    let treeWalker = document.createTreeWalker(element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // Check for a book of the bible, and make sure this text node isn't already in a link
                bibleRegex.lastIndex = 0;
                if (bibleRegex.test(node.textContent)
                    && node.parentElement.classList.contains(BIBLE_PREVIEWER_LINK_CLASS) === false
                    && node.parentElement.closest(`.${BIBLE_PREVIEWER_LINK_CLASS}`) === null) {
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
 * @param {Element} element - The DOM node to search over
 * @param {string} trans - Which bible translation to use
 * @param {string} language - Which language is selected
 * @returns {number} The number of links on the page
 */
function transformBibleReferences(element, trans, language) {
    let nodeList = getNodesToTransform(element);
    const translationHasDeuteroBooks = versions_with_deutero.has(trans);

    for (const node of nodeList) {
        const renderNode = document.createElement('span');
        renderNode.innerHTML = node.textContent.replace(bibleRegex, function (orig, matchedBook, verseListString, judeVerse) {
            let book = '';
            let actual_trans = trans;
            if (judeVerse === undefined) {
                book = getMatchedBookId(matchedBook);
                if (book === '') {
                    console.error("Couldn't match " + orig);
                    return orig;
                }
                // Change translation if it is a deuterocannonical book and an unsupported translation is selected
                if (!translationHasDeuteroBooks && deuteroBooks.has(book)) {
                    actual_trans = DEFAULT_DEUTERO_TRANS;
                }
            } else {
                book = JUDE_BOOK_ID;
                const judeVerseList = splitVerseListString(judeVerse);
                verseListString = judeVerseList.verses.map(verse => `1:${verse}`).join(',');
            }

            let startChap, startVerse, endChap, endVerse, previousChap = '';
            let referenceList = [];
            const {verses: verseList} = splitVerseListString(verseListString);
            const {verses: splitText, delimiters} = splitVerseListString(orig);
            for (const [index, element] of verseList.entries()) {
                [startChap, startVerse, endChap, endVerse, previousChap] = getVerseFromString(element, previousChap);
                book = book.toUpperCase();
                let linkElement;
                if (node.parentElement.tagName === 'A' || node.parentElement.closest('a') !== null) {
                    // Just create a span so that the original link is not modified
                    linkElement = document.createElement('span');
                } else {
                    linkElement = document.createElement('a');
                    linkElement.href = `https://${language}.${BIBLE_DIRECT_URL}${actual_trans}/` +
                        `${book}.${previousChap}?passageId=${book}.${startChap}.${startVerse}`;
                    if (startVerse !== endVerse) {
                        linkElement.href += `-${book}.${endChap}.${endVerse}`;
                    }
                }
                const containerElement = document.createElement('span');

                containerElement.className = BIBLE_PREVIEWER_CONTAINER_CLASS;

                linkElement.className = BIBLE_PREVIEWER_LINK_CLASS;
                linkElement.textContent = splitText[index];
                linkElement.setAttribute(BIBLE_REF_LINK_PROP, `${startChap}:${startVerse}-${endChap}:${endVerse}`);
                linkElement.setAttribute(BIBLE_BOOK_LINK_PROP, book);
                linkElement.setAttribute(BIBLE_TRANS_LINK_PROP, actual_trans);
                containerElement.append(linkElement);
                referenceList.push(containerElement.outerHTML);
            }

            let rebuiltReference = referenceList[0] ?? '';
            for (const [index, delimiter] of delimiters.entries()) {
                rebuiltReference += `${delimiter}${referenceList[index + 1] ?? ''}`;
            }

            return rebuiltReference;
        });

        node.replaceWith(...renderNode.childNodes);
    }

    return nodeList.length;
}

/**
 * Sends a request to the bible API for the specified verses
 * @param {string} book - OSIS abbreviation of the book
 * @param {string} startChapter - chapter number
 * @param {string} startVerse - what verse to start reading from
 * @param {string} endChapter - ending chapter number
 * @param {string} endVerse - what verse to end reading at
 * @param {string} translation - Which bible translation to use
 * @param {Function} callback - What to do after the API returns the verse
 */
function sendAPIRequestForVerses(book, startChapter, startVerse, endChapter, endVerse, translation, callback) {
    let requestLink = `${BIBLE_API_BASE_URL}bibles/${translation}/verses/${book}.${startChapter}.${startVerse}-${book}.${endChapter}.${endVerse}`;

    let xhr = new XMLHttpRequest();
    xhr.open('GET', requestLink, true);
    chrome.runtime.sendMessage({contentScriptQuery: 'getVerses', url: requestLink}, response => {
        response = JSON.parse(response);
        if (response.statusCode >= 300) {
            callback(undefined, undefined, response.statusCode);
        } else {
            let verseReference = response.data.reference;
            if (startVerse !== endVerse) {
                verseReference += ` - ${endChapter}:${endVerse}`;
            }
            callback(response.data.content, verseReference, 200);
        }
    });
}

/**
 * Creates an HTML element with the specified attributes
 * @param {string} elementName The tag name of the HTML element to create (such as div)
 * @param {{[key: string]: string}} parameterDict The dictionary of attributes to set
 * @returns {HTMLElement} The HTML element
 */
function createHtmlElement(elementName, parameterDict) {
    const element = document.createElement(elementName);
    for (const [key, value] of Object.entries(parameterDict)) {
        if (['innerHTML', 'innerText'].includes(key)) {
            element[key] = value;
        } else {
            element.setAttribute(key, value);
        }
    }
    return element;
}

/**
 * Creates the tooltip content for the bible verse
 * @param {object} ref The stored bible verse information
 * @param {string} [ref.verse] The bible verse (for example 1st Corinthians 1:1)
 * @param {string} ref.text The text of the bible verse
 * @param {string} [ref.translation] The translation of the verse
 * @returns {HTMLElement} The html content that the tooltip will use
 */
function createTooltipContent({verse, text, translation}) {
    const containerElement = createHtmlElement('div', {'class': 'biblePreviewerTooltip', 'role': 'tooltip'});
    if (verse) {
        const headerElement = createHtmlElement('div', {'class': 'bpHeaderBar'});
        headerElement.append(createHtmlElement('div', {'class': 'bpVerse', 'innerText': verse}));
        if (translation) {
            headerElement.append(createHtmlElement('div', {'class': 'bpTranslation', 'innerText': translation}));
        }
        containerElement.append(headerElement);
    }
    containerElement.append(createHtmlElement('div', {'class': 'bpTooltipContent', 'innerHTML': text}));
    return containerElement;
}

/**
 * Create the tooltip popups that will show the verse text above the link on hover
 * @param {Element} element The element to search under to create the tooltips for
 */
function createTooltips(element) {
    tippy(element.querySelectorAll(`.${BIBLE_PREVIEWER_LINK_CLASS}`), {
        delay: [250, 750],
        duration: 250,
        theme: 'bible-previewer',
        maxWidth: 350,
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
            const bibleReference = reference.getAttribute(BIBLE_REF_LINK_PROP);
            const fullReference = `${bibleBook} ${bibleReference}`;
            // If there is another link to the same verse on the page, then set that verse text
            return createTooltipContent(bibleVerseDict[fullReference] === undefined ? {text: LOADING_TEXT} : bibleVerseDict[fullReference]);
        },
        onShow: function (instance) {
            instance.setProps({zIndex: ACTIVE_ZINDEX});

            const reference = instance.reference;
            const bibleBook = reference.getAttribute(BIBLE_BOOK_LINK_PROP);
            const bibleReference = reference.getAttribute(BIBLE_REF_LINK_PROP);
            const bibleTrans = reference.getAttribute(BIBLE_TRANS_LINK_PROP);

            const fullReference = `${bibleBook} ${bibleReference}`;
            if (bibleVerseDict[fullReference] === undefined) {
                let [startChap, startVerse, endChap, endVerse] = getVerseFromString(bibleReference, '');
                sendAPIRequestForVerses(bibleBook, startChap, startVerse, endChap, endVerse, bibleTrans,
                    function (verseText, verseReference, status) {
                        if (verseText && status === 200) {
                            // Store into a dictionary for quick access later
                            bibleVerseDict[fullReference] = {
                                text: verseText,
                                verse: verseReference,
                                // The translation that comes back from the API is just a hash, so don't display that
                                translation: ''
                            };
                            instance.setContent(createTooltipContent(bibleVerseDict[fullReference]));
                        } else if (status === 404) {
                            bibleVerseDict[fullReference] = {text: VERSE_NO_EXIST_TEXT};
                            instance.setContent(createTooltipContent(bibleVerseDict[fullReference]));
                        } else if (status === 400) {
                            instance.setContent(createTooltipContent({text: BAD_REQUEST_TEXT}));
                            delete bibleVerseDict[fullReference];
                        } else {
                            instance.setContent(createTooltipContent({text: TRY_AGAIN_TEXT}));
                            delete bibleVerseDict[fullReference];
                        }
                    }
                );
            } else {
                // If there is another link to the same verse on the page, then set that verse text
                instance.setContent(createTooltipContent(bibleVerseDict[fullReference]));
            }
        }
    });
}

/**
 * Performs the link transformation and tooltip generation
 * @param {Element} element The element to search under to create the tooltips for
 * @param {object} request The request object
 */
function addLinks(element, request) {
    let node_length = transformBibleReferences(element, request.translation, request.language);
    if (node_length) {
        // console.time('Create Tooltips');
        createTooltips(element);
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
        if (/localhost:\d+\/__cypress\/runner\/cypress_runner.js/.test(element.src)) {
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
