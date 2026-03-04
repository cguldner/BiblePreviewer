import {DASHES_STR} from './verseParser.mjs';

const SAMUEL_REG = 'Sa?m(?:uel)?';
const KINGS_REG = 'K(?:in)?gs';
const CHRON_REG = 'Chr(?:on(?:icles)?)?';
const MACC_REG = 'Mac(?:c(?:abees)?)?';
const CORINTH_REG = 'Co(?:r(?:inthians?)?)?';
const JUDE_REG = 'Jude?';
const THES_REG = 'Thes(?:s(?:alonians)?)?';
const TIM_REG = 'T(?:imothy|im|i|m)';
const PETER_REG = 'Pe?t(?:er)?';
const JOHN_REG = 'Jo?h?n';

const firstPrefix = String.raw`(?:1(?:st)?|I|First)\s*`;
const secondPrefix = String.raw`(?:2(?:nd)?|II|Second)\s*`;
const thirdPrefix = String.raw`(?:3(?:rd)?|III|Third)\s*`;

const ONE_MAC_TAG = '1Ma';
const TWO_MAC_TAG = '2Ma';
const WISDOM_TAG = 'Wis';
const SIRACH_TAG = 'Sir';
const BARUCH_TAG = 'Bar';
const TOBIT_TAG = 'Tob';
const JUDITH_TAG = 'Jdt';
export const JUDE_BOOK_ID = 'Jud';
// eslint-disable-next-line max-len
const books_start_with_number = `(?:${SAMUEL_REG}|${KINGS_REG}|${CHRON_REG}|${MACC_REG}|${CORINTH_REG}|${THES_REG}|${TIM_REG}|${PETER_REG}|${JOHN_REG})`;
const VERSE_LIST_CONNECTOR_REG = String.raw`(?:[,:;${DASHES_STR}]|\s+and\b)`;

export const deuteroBooks = new Set([ONE_MAC_TAG, TWO_MAC_TAG, WISDOM_TAG, SIRACH_TAG, BARUCH_TAG, TOBIT_TAG, JUDITH_TAG]);

// I make a lot of the () non-capturing, so I can capture the chapter/verse numbers more easily later
export const bibleBooks = {
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

/**
 * Build the bible reference regex used to detect references in page text.
 * @returns {RegExp} A case-insensitive, global bible reference matcher
 */
function buildBibleRegex() {
    // The regex to match book names
    let generatedRegex = `(${Object.keys(bibleBooks).join('|')})`;
    // Matches a required start chapter and verse, then optional continuation delimiters and digits
    generatedRegex += `\\.?\\s*(\\d{1,3}:\\s*\\d{1,3}(?:${VERSE_LIST_CONNECTOR_REG}\\s*\\d{1,3}`;
    // But don't match a single verse if it is right before a book that has a number before it
    generatedRegex += `(?!\\s*${books_start_with_number}))*)`;
    // Add Jude separately because Jude only has 1 chapter, so people usually don't put a chapter with the verse
    generatedRegex += `|${JUDE_REG}\\s*(\\d{1,2}(?:(?:[;,]|\\s+and\\b)?\\s*\\d{1,2})*)`;
    return new RegExp(generatedRegex, 'gi');
}

export const bibleRegex = buildBibleRegex();

const bibleBookMatchers = Object.entries(bibleBooks).map(([pattern, book]) => ({
    regex: new RegExp(`^${pattern}$`, 'i'),
    book
}));
const matchedBookCache = new Map();

/**
 * Maps matched bible book text to its canonical book ID.
 * @param {string} matchedBook Text matched by the bible regex
 * @returns {string} Canonical book ID, or empty string if no match
 */
export function getMatchedBookId(matchedBook) {
    const cacheKey = matchedBook.toLowerCase();
    const cachedBook = matchedBookCache.get(cacheKey);
    if (cachedBook !== undefined) {
        return cachedBook;
    }

    for (const {regex, book} of bibleBookMatchers) {
        if (regex.test(matchedBook)) {
            matchedBookCache.set(cacheKey, book);
            return book;
        }
    }

    // Cache misses too so repeated unknown strings are O(1).
    matchedBookCache.set(cacheKey, '');
    return '';
}
