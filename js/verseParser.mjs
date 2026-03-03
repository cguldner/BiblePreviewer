const DASHES_STR = '–—-';
const DASHES_REG = new RegExp(`[${DASHES_STR}]`);

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

export {DASHES_STR, getVerseFromString};
