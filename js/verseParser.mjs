const DASHES_STR = '–—-';
const DASHES_REG = new RegExp(`[${DASHES_STR}]`);
const VERSE_LIST_DELIMITER_REG = /(?:[;,]\s*|\s+and\s+)/gi;

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

/**
 * Given a list of verses separated by commas/semicolons, split verses while preserving delimiters.
 * @param {string} verseListString The verse list string
 * @returns {{verses: string[], delimiters: string[]}} Parsed verses and delimiters (in order)
 */
function splitVerseListString(verseListString) {
    const delimiters = verseListString.match(VERSE_LIST_DELIMITER_REG) ?? [];
    const verses = verseListString
        .split(VERSE_LIST_DELIMITER_REG)
        .map(verse => verse.trim())
        .filter(Boolean);

    return {verses, delimiters};
}

export {DASHES_STR, getVerseFromString, splitVerseListString};
