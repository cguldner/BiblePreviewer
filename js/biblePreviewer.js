// TODO: Add font size selector to the option panel
// TODO: Add version selector to the popup.html
// TODO: Add turning off on specific websites to popup.html
import '../css/biblePreviewer.scss';
import Tooltip from 'tooltip.js';

const BIBLE_API_KEY = 'omci89GV7FQlNgTIzDULkB16SyEuOr27xC49GEex';
const ESV_API_KEY = '52ca2a57f09495325d251464d417edc1cfe94834';

const BIBLE_API_BASE_URL = `https://bibles.org/v2/`;
const ESV_API_BASE_URL = `https://api.esv.org/v3/passage/text/?q=`;
const DEFAULT_TRANS = 'eng-NASB';
// The translation to use if the version selected doesn't have the Catholic deuterocannonical books
const DEFAULT_DEUTERO_TRANS = 'eng-KJVA';
const BIBLE_DIRECT_URL = `https://bibles.org/`;

const versions_with_deutero = ['eng-KJVA'];
const deutero_books = ['1Macc', '2Macc', 'Wis', 'Sir', 'Bar', 'Tob', 'Jdt'];
const books_start_with_num = '(?:Sam(?:uel)?|K(?:(?:in)?gs)|Chr(?:on(?:icles)?)?|Mac(?:c|cabees)?|Co(?:r(?:inthians)?)?|Thes(?:s(?:alonians)?)?|T(?:i?m?|imothy)|Pe?t(?:er)?|Jo?h?n)';
const firstPrefix = '(?:1(?:st)?|I|First)\\s*';
const secondPrefix = '(?:2(?:nd)?|II|Second)\\s*';
const thirdPrefix = '(?:3(?:rd)?|III|Third)\\s*';
const dashes = /[–—-]/;

let headElement = document.getElementsByTagName('head')[0];

// Lookup dictionary for verses
let bibleVerseDict = {};

// I make a lot of the () non-capturing, so I can capture the chapter/verse numbers more easily later
const bibleBooks = {
    'Gen(?:esis)?': 'Gen',
    'Ex(?:od(?:us)?)?': 'Exod',
    'Le(?:v(?:iticus)?)?': 'Lev',
    'Num(?:b(?:ers)?)?': 'Num',
    'D(?:t|eut(?:eronomy)?)': 'Deut',
    'Jo(?:s(?:h(?:ua)?)?)?': 'Josh',
    'J(?:dgs?|udg(?:es)?)': 'Judg',
    'Ru?th': 'Ruth',
    [firstPrefix + 'Sam(?:uel)?']: '1Sam',
    [secondPrefix + 'Sam(?:uel)?']: '2Sam',
    [firstPrefix + 'K(?:(?:in)?gs)']: '1Kgs',
    [secondPrefix + 'K(?:(?:in)?gs)']: '2Kgs',
    [firstPrefix + 'Chr(?:on(?:icles)?)?']: '1Chr',
    [secondPrefix + 'Chr(?:on(?:icles)?)?']: '2Chr',
    'Ez(?:ra?)?': 'Ezra',
    'Ne(?:h(?:emiah)?)?': 'Neh',
    'Tob(?:it|ias)?': 'Tob',
    'J(?:d?th?|udith)': 'Jdt',
    'Est(?:h(?:er)?)?': 'Esth',
    [firstPrefix + 'Mac(?:c(?:abees)?)?']: '1Macc',
    [secondPrefix + 'Mac(?:c(?:abees)?)?']: '2Macc',
    'Jo?b': 'Job',
    'Ps(?:a(?:lms?)?)?': 'Ps',
    'Pro(?:v(?:erbs)?)?': 'Prov',
    'Ecc(?:les?|lesiastes)?': 'Eccl',
    'So(?:S|ng(?:\\s*of\\s*(?:Sol(?:omon)?|Songs?))?)': 'Song',
    'Wis(?:dom)?(?:\\s*of\\s*Sol(?:omon)?)?': 'Wis',
    'Sir(?:ach)?': 'Sir',
    'Bar(?:uch)?': 'Bar',
    'Is(?:a(?:iah)?)?': 'Isa',
    'Jer(?:emiah)?': 'Jer',
    'Lam(?:entations)?': 'Lam',
    'Ez(?:e?k?|ekiel)': 'Ezek',
    'Dan(?:iel)?': 'Dan',
    'Hos(?:ea)?': 'Hos',
    'Joel': 'Joel',
    'Amos': 'Amos',
    'Ob(?:ad(?:iah)?)?': 'Obad',
    'Jon(?:ah)?': 'Jonah',
    'Mic(?:ah)?': 'Mic',
    'Nah(?:um)?': 'Nah',
    'Hab(?:akkuk)?': 'Hab',
    'Zep(?:h(?:aniah)?)?': 'Zeph',
    'Hag(?:gai)?': 'Hag',
    'Zec(?:h(?:ariah)?)?': 'Zech',
    'Mal(?:achi)?': 'Mal',
    'M(?:t|att(?:h(?:ew)?)?)': 'Matt',
    'M(?:k|ark?)': 'Mark',
    'L(?:k|uke?)': 'Luke',
    'Jo?h?n': 'John',
    'Acts?': 'Acts',
    'Ro(?:m(?:ans)?)?': 'Rom',
    [firstPrefix + 'Co(?:r(?:inthian(?:s)?)?)?']: '1Cor',
    [secondPrefix + 'Co(?:r(?:inthian(?:s)?)?)?']: '2Cor',
    'Gal(?:atians)?': 'Gal',
    'Eph(?:es(?:ians)?)?': 'Eph',
    'Phil(?:ippians)?': 'Phil',
    'Col(?:ossians)?': 'Col',
    [firstPrefix + 'Thes(?:s(?:alonians)?)?']: '1Thess',
    [secondPrefix + 'Thes(?:s(?:alonians)?)?']: '2Thess',
    [firstPrefix + 'T(?:i?m?|imothy)']: '1Tim',
    [secondPrefix + 'T(?:i?m?|imothy)']: '2Tim',
    'Titus': 'Titus',
    'Phil(?:em(?:on)?)?': 'Phil',
    'Heb(?:rews?)?': 'Heb',
    'James': 'Jas',
    [firstPrefix + 'Pe?t(?:er)?']: '1Pet',
    [secondPrefix + 'Pe?t(?:er)?']: '2Pet',
    [firstPrefix + 'Jo?h?n']: '1John',
    [secondPrefix + 'Jo?h?n']: '2John',
    [thirdPrefix + 'Jo?h?n']: '3John',
    'Jude?': 'Jude',
    'R(?:e?v|evelation)': 'Rev'
};

// The regex to match book names
// let bibleRegex = '(' + Object.keys(bibleBooks).join('|') + ')';
// // Matches the first chapter:verse, and optionally an endchapter:verse
// bibleRegex += '\\.?\\s*((?:[0-9]{1,3}[:]\\s*[0-9]{1,2}(?:[–—-][0-9]{1,2}(?:[:][0-9]{1,2})?)?)';
// // After the first, can leave off the chapter, so then a single verse will match to the last listed chapter
// bibleRegex += '(?:[,;]\\s*(?:(?:[0-9]{1,3}(?:[:][0-9]{1,2}(?:[–—-][0-9]{1,2})?))';
// // But don't match a single verse if it is right before a book that has a number before it
// bibleRegex += '|[0-9]{1,3}(?:[–—-][0-9]{1,2})?(?![,;]\\s*' + books_start_with_num + ')))*)';
// // Add Jude separately because Jude only has 1 chapter, so people usually don't put a chapter with the verse
// bibleRegex += '|(?:Jude?\\s*([0-9]{1,2}(?:[,;]?\\s*[0-9]{1,2})*))';
// bibleRegex = new RegExp(bibleRegex, 'gi');
// console.log(bibleRegex);

let bibleRegex = /(Gen(?:esis)?|Ex(?:od(?:us)?)?|Le(?:v(?:iticus)?)?|Num(?:b(?:ers)?)?|D(?:t|eut(?:eronomy)?)|Jo(?:s(?:h(?:ua)?)?)?|J(?:dgs?|udg(?:es)?)|Ru?th|(?:1(?:st)?|I|First)\s*Sam(?:uel)?|(?:2(?:nd)?|II|Second)\s*Sam(?:uel)?|(?:1(?:st)?|I|First)\s*K(?:(?:in)?gs)|(?:2(?:nd)?|II|Second)\s*K(?:(?:in)?gs)|(?:1(?:st)?|I|First)\s*Chr(?:on(?:icles)?)?|(?:2(?:nd)?|II|Second)\s*Chr(?:on(?:icles)?)?|Ez(?:ra?)?|Ne(?:h(?:emiah)?)?|Tob(?:it|ias)?|J(?:d?th?|udith)|Est(?:h(?:er)?)?|(?:1(?:st)?|I|First)\s*Mac(?:c(?:abees)?)?|(?:2(?:nd)?|II|Second)\s*Mac(?:c(?:abees)?)?|Jo?b|Ps(?:a(?:lms?)?)?|Pro(?:v(?:erbs)?)?|Ecc(?:les?|lesiastes)?|So(?:S|ng(?:\s*of\s*(?:Sol(?:omon)?|Songs?))?)|Wis(?:dom)?(?:\s*of\s*Sol(?:omon)?)?|Sir(?:ach)?|Bar(?:uch)?|Is(?:a(?:iah)?)?|Jer(?:emiah)?|Lam(?:entations)?|Ez(?:e?k?|ekiel)|Dan(?:iel)?|Hos(?:ea)?|Joel|Amos|Ob(?:ad(?:iah)?)?|Jon(?:ah)?|Mic(?:ah)?|Nah(?:um)?|Hab(?:akkuk)?|Zep(?:h(?:aniah)?)?|Hag(?:gai)?|Zec(?:h(?:ariah)?)?|Mal(?:achi)?|M(?:t|att(?:h(?:ew)?)?)|M(?:k|ark?)|L(?:k|uke?)|Jo?h?n|Acts?|Ro(?:m(?:ans)?)?|(?:1(?:st)?|I|First)\s*Co(?:r(?:inthian(?:s)?)?)?|(?:2(?:nd)?|II|Second)\s*Co(?:r(?:inthian(?:s)?)?)?|Gal(?:atians)?|Eph(?:es(?:ians)?)?|Phil(?:ippians)?|Col(?:ossians)?|(?:1(?:st)?|I|First)\s*Thes(?:s(?:alonians)?)?|(?:2(?:nd)?|II|Second)\s*Thes(?:s(?:alonians)?)?|(?:1(?:st)?|I|First)\s*T(?:i?m?|imothy)|(?:2(?:nd)?|II|Second)\s*T(?:i?m?|imothy)|Titus|Phil(?:em(?:on)?)?|Heb(?:rews?)?|James|(?:1(?:st)?|I|First)\s*Pe?t(?:er)?|(?:2(?:nd)?|II|Second)\s*Pe?t(?:er)?|(?:1(?:st)?|I|First)\s*Jo?h?n|(?:2(?:nd)?|II|Second)\s*Jo?h?n|(?:3(?:rd)?|III|Third)\s*Jo?h?n|Jude?|R(?:e?v|evelation))\.?\s*((?:[0-9]{1,3}[:]\s*[0-9]{1,2}(?:[–—-][0-9]{1,2}(?:[:][0-9]{1,2})?)?)(?:[,;]\s*(?:(?:[0-9]{1,3}(?:[:][0-9]{1,2}(?:[–—-][0-9]{1,2})?))|[0-9]{1,3}(?:[–—-][0-9]{1,2})?(?![,;]\s*(?:Sam(?:uel)?|K(?:(?:in)?gs)|Chr(?:on(?:icles)?)?|Mac(?:c|cabees)?|Co(?:r(?:inthians)?)?|Thes(?:s(?:alonians)?)?|T(?:i?m?|imothy)|Pe?t(?:er)?|Jo?h?n))))*)|(?:Jude?\s*([0-9]{1,2}(?:[,;]?\s*[0-9]{1,2})*))/gi;

// Starts the app only once the page has completely finished loading
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.translation === undefined) {
        request.translation = DEFAULT_TRANS;
    }

    initBiblePreviewer(request.translation, request.url);
});

/**
 * Initializes the app
 */
function initBiblePreviewer(translation, url) {
    // Load FUMS - copyright stuff
    let script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = document.location.protocol + '//d2ue49q0mum86x.cloudfront.net/include/fums.c.js';
    headElement.appendChild(script);

    let node_length = transformBibleReferences(translation);
    if (node_length) {
        // console.time('Create Tooltips');
        createTooltips(url);
        // console.timeEnd('Create Tooltips');
    }
}

/**
 * Transform all bible references into links using a TreeWalker
 * @param {string} trans - Which bible translation to use
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
                let directHref = `${BIBLE_DIRECT_URL}${actual_trans}/${book}/${prevChap}/${startVerse}`;
                let apiLink = `${startChap}:${startVerse}-${endChap}:${endVerse}`;
                refList.push('<span class="biblePreviewerContainer">' +
                    `<a class="biblePreviewerLink" href="${directHref}" target="_blank" data-bible-ref="${apiLink}"
                            data-bible-book="${book}" data-bible-trans="${actual_trans}">${splitText[i]}</a></span>`);
            }

            return refList.join(', ');
        });
    });
    // console.timeEnd('Change to links');
    return nodeList.length
}

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
 * Create the tooltip popups that will show the verse text above the link on hover
 */
function createTooltips(webpageUrl) {
    document.querySelectorAll('.biblePreviewerLink').forEach(function (link) {
        let tool, enterTimeout, exitTimeout;
        // Add listener to biblePreviewerContainer so that we can hover over the tooltip as well
        link.parentElement.addEventListener('mouseenter', function (e) {
            if (tool) {
                link.nextSibling.style.zIndex = '999';
            }
            clearTimeout(exitTimeout);
            enterTimeout = setTimeout(function () {
                // If there isn't a div following the link, then this is the first time hovering this link
                if (link.nextSibling === null) {
                    let boundElem = document.documentElement;
                    if (webpageUrl.match('docs.google')) {
                        boundElem = document.getElementsByClassName('kix-page-compact-first')[0];
                    }

                    tool = new Tooltip(link, {
                        placement: 'top',
                        title: 'Loading',
                        trigger: 'manual',
                        html: true,
                        arrowSelector: '.bpTooltipArrow',
                        innerSelector: '.bpTooltipInner',
                        template: '<div class="biblePreviewerTooltip" role="tooltip">' +
                            `<div class="bpHeaderBar"><div class="bpVerse">${link.textContent}</div>` +
                            `<div class="bpTranslation">${link.dataset.bibleTrans}</div></div>` +
                            '<div class="bpTooltipInner"></div>' +
                            '<div class="bpTooltipArrow"></div>' +
                            '</div>',
                        boundariesElement: boundElem
                    });
                }

                let fullRef = link.dataset.bibleBook + ' ' + link.dataset.bibleRef;
                // Can remove some of this stuff later, once google docs works
                if (tool) {
                    if (bibleVerseDict[fullRef] === undefined) {
                        tool.updateTitleContent('Loading');
                        let [startChap, startVerse, endChap, endVerse, prevChap] = getVerseFromString(link.dataset.bibleRef, null);
                        sendAPIRequestForVersesMultiChapter(link.dataset.bibleBook, startChap, startVerse, endChap, endVerse, link.dataset.bibleTrans, function (verseText, verseRef, status) {
                            if (verseText && status === 200) {
                                let verseSel = tool.popperInstance.popper.querySelectorAll('.bpVerse')[0];
                                verseSel.innerText = verseRef;
                                tool.updateTitleContent(verseText);
                                // Store into a dictionary for quick access later
                                bibleVerseDict[fullRef] = verseText;
                            } else if (status === 404) {
                                tool.updateTitleContent('Verse does not exist');
                                bibleVerseDict[fullRef] = 'Verse does not exist';
                            } else if (status === 0) {
                                tool.updateTitleContent('Request couldn\'t be completed, try again later');
                            } else {
                                tool.updateTitleContent('Try again later');
                            }
                        });
                    } else {
                        // If there is another link to the same verse on the page, then set that verse text
                        tool.updateTitleContent(bibleVerseDict[fullRef]);
                    }
                    tool.show();
                }
            }, 250);
        });
        link.parentElement.addEventListener('mouseleave', function (e) {
            if (tool) {
                link.nextSibling.style.zIndex = '998';
            }
            clearTimeout(enterTimeout);
            // Destroy the tooltip to prevent any stray tooltips if mouse is moved fast
            exitTimeout = setTimeout(function () {
                if (tool) {
                    tool.hide();
                }
            }, 750);
        });
    });
}

/**
 * Sends a request to the bible API for the specified verses
 * @param {string} book - OSIS abbreviation of the book
 * @param {string} startChapter - chapter number
 * @param {string} startVerse - what verse to start reading from
 * @param {string} endVerse - what verse to end reading at
 * @param {string} translation - Which bible translation to use
 * @param cb - What to do after the API returns the verse
 */
function sendAPIRequestForVerses(book, startChapter, startVerse, endVerse, translation, cb) {
    let requestLink = `${BIBLE_API_BASE_URL}chapters/${translation}:${book}.${startChapter}/verses.js?start=${startVerse}&end=${endVerse}`;

    let xhr = new XMLHttpRequest();
    xhr.open('GET', requestLink, true);
    chrome.runtime.sendMessage({contentScriptQuery: 'getVerses', url: requestLink}, response => {
        let res = JSON.parse(response).response;
        let verses = res.verses;
        let startChapterLastVerse = verses[0].previous.verse.id.split('.')[2];
        let bapi = document.createElement('script');
        // Make a call to the FUMS - copyright stuff
        bapi.text = `_BAPI.t("${res.meta.fums_tid}")`;
        headElement.appendChild(bapi);
        headElement.removeChild(bapi);

        if (verses === undefined) {
            cb(null, null, 404);
        } else {
            cb(verses, startChapterLastVerse, 200);
        }
    });
}


/**
 * Sends a request to the bible API for the specified verses
 * @param {string} book - OSIS abbreviation of the book
 * @param {string} startChapter - starting chapter number
 * @param {string} startVerse - what verse to start reading from
 * @param {string} endChapter - ending chapter number
 * @param {string} endVerse - what verse to end reading at
 * @param {string} translation - Which bible translation to use
 * @param cb - What to do after the API returns the verse
 */
function sendAPIRequestForVersesMultiChapter(book, startChapter, startVerse, endChapter, endVerse, translation, cb) {
    if (startChapter !== endChapter) {
        sendAPIRequestForVerses(book, endChapter, '1', endVerse, translation, function (endChapterVerses, startChapterLastVerse, err1) {
            if (endChapterVerses !== null && err1 === 200) {
                sendAPIRequestForVerses(book, startChapter, startVerse, startChapterLastVerse, translation, function (startChapterVerses, startChapterLastVerse, err2) {
                    if (startChapterVerses !== null && err2 === 200) {
                        let verseText = startChapterVerses.map(function (verse) {
                            return verse.text;
                        }).join('');
                        verseText += `<h2>Chapter ${endChapter}</h2>`;
                        verseText += endChapterVerses.map(function (verse) {
                            return verse.text;
                        }).join('');
                        let verseRef = startChapterVerses[0].reference + ' - ' + endChapterVerses[endChapterVerses.length - 1].reference;
                        cb(verseText, verseRef, 200);
                    } else {
                        cb(null, null, err2);
                    }
                });
            } else {
                cb(null, err1);
            }
        });
    } else {
        sendAPIRequestForVerses(book, startChapter, startVerse, endVerse, translation, function (verseObj, startChapterLastVerse, err) {
            if (verseObj !== null && err === 200) {
                let verseText = verseObj.map(function (verse) {
                    return verse.text;
                }).join('');
                let verseRef = verseObj[0].reference;
                if (startVerse !== endVerse) {
                    verseRef += ' - ' + verseObj[verseObj.length - 1].reference;
                }
                cb(verseText, verseRef, 200);
            } else {
                cb(null, null, err);
            }
        });
    }
}

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
