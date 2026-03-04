
const TEST_FILE = Cypress.expose('testFile');
const LINK_SELECTOR = Cypress.expose('linkSelector');
const CONTAINER_SELECTOR = Cypress.expose('containerSelector');
const DEFAULT_DEUTERO_TRANS = '9879dbb7cfe39e4d-02';

/**
 * Escapes a string so it can be used in a RegExp safely
 * @param {string} text The text to escape
 * @returns {string} The escaped text
 */
function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates an exact-match regex for rendered link text
 * @param {string} bibleReference The rendered text to match
 * @returns {RegExp} Regex that matches only the full rendered text
 */
function exactTextRegex(bibleReference) {
    return new RegExp(`^\\s*${escapeRegExp(bibleReference)}\\s*$`);
}

/**
 * Verifies that a link is created for the given bible reference
 * @param {string} bibleReference The bible reference to verify
 * @param {string} containerSelector The selector of the container to look in
 */
function linkMatch(bibleReference, containerSelector = 'body') {
    cy.get(containerSelector).find(LINK_SELECTOR).contains(exactTextRegex(bibleReference)).should('exist');
}

/**
 * Gets a single bible previewer link by exact rendered text
 * @param {string} bibleReference The rendered text of the link
 * @param {string} containerSelector The selector of the container to look in
 * @returns {*} The selected link chainable
 */
function getLinkByText(bibleReference, containerSelector = 'body') {
    return cy.get(containerSelector)
        .find(LINK_SELECTOR)
        .contains(exactTextRegex(bibleReference));
}

/**
 * Verifies that multiple references are present as links
 * @param {string[]} bibleReferences The references to verify
 * @param {string} [containerSelector] The selector of the container to look in
 */
function linksMatch(bibleReferences, containerSelector = 'body') {
    for (const reference of bibleReferences) {
        linkMatch(reference, containerSelector);
    }
}

/**
 * Verifies the data and href attributes for a rendered bible link
 * @param {object} options Link assertion options
 * @param {string} options.text The rendered link text
 * @param {string} options.book The expected data-bible-book value
 * @param {string} options.reference The expected data-bible-ref value
 * @param {string} [options.containerSelector] The selector of the container to look in
 * @param {string[]} [options.hrefIncludes] Strings that should be included in href
 * @param {string[]} [options.hrefExcludes] Strings that should not be included in href
 * @param {RegExp} [options.hrefPattern] Optional regex to match full href
 */
function assertLinkAttributes({
    text,
    book,
    reference,
    containerSelector = 'body',
    hrefIncludes = [],
    hrefExcludes = [],
    hrefPattern,
}) {
    getLinkByText(text, containerSelector)
        .should('have.attr', 'data-bible-book', book)
        .and('have.attr', 'data-bible-ref', reference);

    getLinkByText(text, containerSelector)
        .should('have.attr', 'href')
        .then(href => {
            if (hrefPattern) {
                expect(href).to.match(hrefPattern);
            }
            for (const includeText of hrefIncludes) {
                expect(href).to.include(includeText);
            }
            for (const excludeText of hrefExcludes) {
                expect(href).not.to.include(excludeText);
            }
        });
}

context('Link Creation', () => {
    beforeEach(() => {
        cy.visit(TEST_FILE);
        cy.stubApiRequests();
    });

    const singleReferenceCases = [
        {name: 'single chapter and single verse', text: 'John 4:24'},
        {name: 'single chapter and multiple verses', text: 'Gen 4:24-25'},
        {name: 'multiple chapters and multiple verses', text: 'Matt 4:24-5:3'},
        {name: '3-digit chapter and verse', text: 'Psalm 119:105'},
        {name: 'Jude without chapter', text: 'Jude 6'},
        {name: 'Jude with chapter', text: 'Jude 1:7'},
        {name: 'roman numeral prefix', text: 'II Tim 3:16', containerSelector: '.roman-prefix-test'},
        {name: 'word prefix', text: 'First Kings 2:3', containerSelector: '.word-prefix-test'},
    ];

    for (const testCase of singleReferenceCases) {
        it(`Should create link for ${testCase.name}`, () => {
            linkMatch(testCase.text, testCase.containerSelector);
        });
    }

    const listReferenceCases = [
        {name: 'single verses in the same chapter', texts: ['Gal 3:5', '8']},
        {name: 'multiple verses in the same chapter', texts: ['Joel 2:4', '9-10'], containerSelector: '.multiple-verse-same-chapter'},
        {name: 'multiple chapter:verse references in same book', texts: ['1 Cor 3:6', '5:8']},
        {name: 'multiple chapter:verse references split with semicolon', texts: ['2 Cor 3:6', '5:8']},
        {name: 'multiple chapter:verse range references in same book', texts: ['Psalm 133:99-100', '144:89-200']},
        {name: 'multiple references for different books', texts: ['Sirach 1:20', 'Song of Songs 4:3']},
        {
            name: 'leading chapter number after prior passage',
            texts: ['Phil. 2:12', '1 Pet. 1:9'],
            containerSelector: '.following-verse-start-chapter-test'
        },
        {name: 'unicode dashes in verse ranges', texts: ['Gen 1:1–3', 'Gen 1:4—5'], containerSelector: '.unicode-dash-test'},
        {name: 'mixed separators list', texts: ['Rev 1:1', '2-3', '4:5'], containerSelector: '.mixed-separators-test'},
        {name: 'and separator list', texts: ['I Corinthians 5:11', '6:9-11', '6:18-20', '7:1-3', '7:8-9'], containerSelector: '.and-separator-test'},
        {name: 'Jude list with and and comma separators', texts: ['Jude 6', '8', '10'], containerSelector: '.jude-list-test'},
    ];

    for (const testCase of listReferenceCases) {
        it(`Should create links for ${testCase.name}`, () => {
            linksMatch(testCase.texts, testCase.containerSelector);
        });
    }

    it('Should not overwrite existing links', () => {
        // At least wait until bible links have started appearing
        cy.get(LINK_SELECTOR).should('exist');
        cy.get('a#link-to-nowhere').should('have.attr', 'href', '#');
        cy.get('.keep-existing-link-test').find('a').should('have.length', 2);
        cy.get('.keep-existing-link-test').find(LINK_SELECTOR).should('have.length', 2);
        cy.get('.keep-existing-link-test').find(CONTAINER_SELECTOR).should('have.length', 2);
    });
    it('Should not overwrite existing links with nested HTML in link', () => {
        cy.get('a#link-to-nowhere-with-html').should('have.attr', 'href', '#');
        cy.get('.keep-existing-link-test-with-html').find('a').should('have.length', 1);
        cy.get('.keep-existing-link-test-with-html').find(LINK_SELECTOR).should('have.length', 1);
        cy.get('.keep-existing-link-test-with-html').find(CONTAINER_SELECTOR).should('have.length', 1);
    });

    it('Should not transform non-reference text', () => {
        cy.get('.non-reference-test').find(LINK_SELECTOR).should('not.exist');
    });

    it('Should generate valid href for single-verse link with no encoded newline', () => {
        assertLinkAttributes({
            text: 'John 4:24',
            book: 'JHN',
            reference: '4:24-4:24',
            hrefPattern: /^https:\/\/eng\.global\.bible\/bible\/[^/]+\/JHN\.4\?passageId=JHN\.4\.24$/,
            hrefExcludes: ['%0A', '%0D'],
        });
    });

    it('Should map following numeric-prefixed reference to the correct book in attrs and href', () => {
        assertLinkAttributes({
            text: '1 Pet. 1:9',
            containerSelector: '.following-verse-start-chapter-test',
            book: '1PE',
            reference: '1:9-1:9',
            hrefIncludes: ['/1PE.1?passageId=1PE.1.9'],
            hrefExcludes: ['PHP'],
        });
    });

    it('Should carry chapter context in same-reference-list follow-up verses', () => {
        assertLinkAttributes({
            text: '8',
            book: 'GAL',
            reference: '3:8-3:8',
            hrefIncludes: ['/GAL.3?passageId=GAL.3.8'],
        });
    });

    it('Should carry chapter context for mixed separator list segments', () => {
        assertLinkAttributes({
            text: '2-3',
            containerSelector: '.mixed-separators-test',
            book: 'REV',
            reference: '1:2-1:3',
            hrefIncludes: ['/REV.1?passageId=REV.1.2-REV.1.3'],
        });
        assertLinkAttributes({
            text: '4:5',
            containerSelector: '.mixed-separators-test',
            book: 'REV',
            reference: '4:5-4:5',
            hrefIncludes: ['/REV.4?passageId=REV.4.5'],
        });
    });


    it('Should carry chapter context for and-separated list segments', () => {
        assertLinkAttributes({
            text: '7:8-9',
            containerSelector: '.and-separator-test',
            book: '1CO',
            reference: '7:8-7:9',
            hrefIncludes: ['/1CO.7?passageId=1CO.7.8-1CO.7.9'],
        });
    });

    it('Should preserve and delimiters between transformed links', () => {
        cy.get('.and-separator-test')
            .invoke('text')
            .then(text => {
                expect(text.replace(/\s+/g, ' ').trim()).to.equal('I Corinthians 5:11, 6:9-11, 6:18-20, 7:1-3 and 7:8-9');
            });

        cy.get('.and-separator-test')
            .find(CONTAINER_SELECTOR)
            .should('have.length', 5);
    });

    it('Should parse Jude list segments as chapter 1 references', () => {
        assertLinkAttributes({
            text: 'Jude 6',
            containerSelector: '.jude-list-test',
            book: 'JUD',
            reference: '1:6-1:6',
            hrefIncludes: ['/JUD.1?passageId=JUD.1.6'],
        });
        assertLinkAttributes({
            text: '8',
            containerSelector: '.jude-list-test',
            book: 'JUD',
            reference: '1:8-1:8',
            hrefIncludes: ['/JUD.1?passageId=JUD.1.8'],
        });
        assertLinkAttributes({
            text: '10',
            containerSelector: '.jude-list-test',
            book: 'JUD',
            reference: '1:10-1:10',
            hrefIncludes: ['/JUD.1?passageId=JUD.1.10'],
        });
    });

    it('Should preserve and delimiter in transformed Jude list text', () => {
        cy.get('.jude-list-test')
            .invoke('text')
            .then(text => {
                expect(text.replace(/\s+/g, ' ').trim()).to.equal('Jude 6 and 8, 10');
            });

        cy.get('.jude-list-test')
            .find(CONTAINER_SELECTOR)
            .should('have.length', 3);
    });

    it('Should preserve original delimiters between transformed links', () => {
        cy.get('.mixed-separators-test')
            .invoke('text')
            .then(text => {
                expect(text.replace(/\s+/g, ' ').trim()).to.equal('Rev 1:1; 2-3, 4:5');
            });

        cy.get('.mixed-separators-test')
            .find(CONTAINER_SELECTOR)
            .should('have.length', 3);
    });

    it('Should use the deuterocanonical fallback translation for unsupported translations', () => {
        assertLinkAttributes({
            text: 'Sirach 2:1',
            containerSelector: '.deutero-fallback-test',
            book: 'SIR',
            reference: '2:1-2:1',
            hrefIncludes: [`/bible/${DEFAULT_DEUTERO_TRANS}/SIR.2?passageId=SIR.2.1`],
        });
    });
});
