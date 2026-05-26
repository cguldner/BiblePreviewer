const BIBLE_API_BASE_URL = 'https://api.scripture.api.bible/v1/';

const DEFAULT_TRANS = '9879dbb7cfe39e4d-04';
const DEFAULT_DEUTERO_TRANS = '9879dbb7cfe39e4d-02';
const DEFAULT_LANGUAGE = 'eng';

/**
 * Build the API URL for a verse range request.
 * @param {string} book The OSIS book abbreviation
 * @param {string} startChapter The starting chapter
 * @param {string} startVerse The starting verse
 * @param {string} endChapter The ending chapter
 * @param {string} endVerse The ending verse
 * @param {string} translation The Bible translation id
 * @returns {string} API URL for the verse lookup
 */
function buildVerseApiUrl(book, startChapter, startVerse, endChapter, endVerse, translation) {
    return `${BIBLE_API_BASE_URL}bibles/${translation}/verses/${book}.${startChapter}.${startVerse}-${book}.${endChapter}.${endVerse}`;
}

export {
    BIBLE_API_BASE_URL,
    DEFAULT_DEUTERO_TRANS,
    DEFAULT_LANGUAGE,
    DEFAULT_TRANS,
    buildVerseApiUrl
};
