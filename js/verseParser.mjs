const DASHES_STR = '–—-';
const DASHES_REG = new RegExp(`[${DASHES_STR}]`);
const LIST_SEPARATORS_REGEX = /(?:\s*[,;]\s*|\s+and\s+)/gi;

/**
 * Splits a verse list into individual verse expressions.
 * Supports comma, semicolon, and "and" separators.
 * @param {string} verseListString A list of verse expressions
 * @returns {string[]} The individual verse expressions
 */
function splitVerseList(verseListString) {
    return verseListString
        .split(LIST_SEPARATORS_REGEX)
        .map(entry => entry.trim())
        .filter(entry => entry.length > 0);
}

/**
 * Splits a full matched bible reference string into display chunks for each generated link.
 * Example: "1 Cor 5:11, 6:9-11 and 6:18-20" =>
 * ["1 Cor 5:11", "6:9-11", "6:18-20"]
 * @param {string} matchedReference Full matched reference text
 * @returns {string[]} Text chunk to render for each link
 */
function splitReferenceDisplayText(matchedReference) {
    return splitVerseList(matchedReference);
}

/**
 * Given a string, gets the verse components and previous chapter (if it exists)
 * @param {string} verseString The verse
 * @param {string} previousChap The previous chapter
 * @returns {Array} Each component of the verse, including start chapter and verse, and end chapter and verse
 */
function getVerseFromString(verseString, previousChap) {
    let startChap, startVerse, endChap, endVerse;
    let [start, end] = verseString.split(DASHES_REG);

    [startChap, startVerse] = start.split(':');
    if (startVerse === undefined) {
        startVerse = startChap;
        startChap = previousChap;
    } else {
        previousChap = startChap;
    }

    if (end === undefined) {
        endVerse = startVerse;
        endChap = startChap;
    } else {
        [endChap, endVerse] = end.split(':');
        if (endVerse === undefined) {
            endVerse = endChap;
            endChap = startChap;
        } else {
            previousChap = endChap;
        }
    }

    return [startChap, startVerse, endChap, endVerse, previousChap];
}

export {DASHES_STR, getVerseFromString, splitVerseList, splitReferenceDisplayText};
