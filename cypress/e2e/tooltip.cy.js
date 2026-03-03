
const TEST_FILE = Cypress.expose('testFile');
const LINK_SELECTOR = Cypress.expose('linkSelector');
const TOOLTIP_SELECTOR = Cypress.expose('tooltipSelector');
const TOOLTIP_TEXT_SELECTOR = Cypress.expose('tooltipTextSelector');
const API_ENDPOINT = Cypress.expose('apiEndpoint');

/**
 * Escapes a string so it can be used in a RegExp safely
 * @param {string} text The text to escape
 * @returns {string} The escaped text
 */
function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Stub API requests to the bible endpoint, so they don't use up the request limit
 */
function stubApiRequests() {
    cy.stubApiRequests();
}

/**
 * Listen for the API requests to the bible endpoint, so they can be waited on later
 */
function listenForApiRequests() {
    cy.listenForApiRequests();
}

/**
 * Turns a bible reference portion into a regex
 * @param {string} reference The part of the reference to turn into a word bounded regex
 * @returns {RegExp} A word bounded regex
 */
function referenceToRegexp(reference) {
    return new RegExp(`\\b${reference}\\b`);
}

/**
 * Turns the parts of the bible reference into a full reference
 * @param {string} book Bible book name
 * @param {string} startChap Chapter number
 * @param {string} startVerse What verse to start reading from
 * @param {string} [endChap] Ending chapter number
 * @param {string} [endVerse] What verse to end reading at
 * @returns {string} The full bible reference
 */
function biblePartsToReference(book, startChap, startVerse, endChap = '', endVerse = '') {
    let bibleReference = `${book} `;
    if (startChap !== '') {
        bibleReference += `${startChap}:`;
    }
    bibleReference += startVerse;
    if (endChap !== '' || endVerse !== '') {
        bibleReference += '-';
        if (endChap) {
            bibleReference += `${endChap}:`;
        }
        bibleReference += endVerse;
    }
    return bibleReference;
}

/**
 * Verifies that a tooltip is created for the given bible reference when hovered
 * @param {string} bibleReference The bible reference to verify
 * @param {string} [containerSelector] The selector of the container to look in
 */
function tooltipShow(bibleReference, containerSelector = 'body') {
    cy.get(containerSelector).find(TOOLTIP_SELECTOR).should('not.exist');
    cy.get(containerSelector)
        .find(LINK_SELECTOR)
        .contains(new RegExp(`^\\s*${escapeRegExp(bibleReference)}\\s*$`))
        .should('exist')
        .realHover();
    cy.get(containerSelector).find(TOOLTIP_SELECTOR).should('exist').should('be.visible');
}

/**
 * Hovers the specified verse and waits for the corresponding API request to complete
 * @param {string} bibleReference The bible reference to hover
 */
function tooltipShowAndWaitForApi(bibleReference) {
    tooltipShow(bibleReference);
    cy.wait('@getRequest');
}

/**
 * Unhovers the tooltip, and waits for it to disappear
 */
function unhoverTooltip() {
    cy.get('#hover-safe-zone').realHover();
    // Wait until the tooltip disappears
    cy.get(TOOLTIP_SELECTOR).should('not.exist');
}

/**
 * Verifies that the tooltip header has the correct information
 * @param {string} book Bible book name
 * @param {string} startChap Chapter number
 * @param {string} startVerse What verse to start reading from
 * @param {string} [endChap] Ending chapter number
 * @param {string} [endVerse] What verse to end reading at
 */
function tooltipHeaderVerify(book, startChap, startVerse, endChap = '', endVerse = '') {
    cy.get(`${TOOLTIP_SELECTOR} .bpHeaderBar`).should('exist')
        .contains(new RegExp(`\\b${book}`))
        .contains(referenceToRegexp(startChap))
        .contains(referenceToRegexp(startVerse))
        .contains(referenceToRegexp(endChap))
        .contains(referenceToRegexp(endVerse));
}

/**
 * Verifies that the tooltip content has the correct information
 * @param {string} startVerse What verse to start reading from
 * @param {string} [endVerse] What verse to end reading at
 */
function tooltipContentVerify(startVerse, endVerse = '') {
    cy.get(TOOLTIP_TEXT_SELECTOR).as('content')
        .should('exist')
        .invoke('text')
        .should('not.equal', 'Loading')
        .should('not.equal', 'Verse does not exist')
        .should('not.equal', 'Try again later');
    cy.get('@content').find('span').contains(referenceToRegexp(startVerse));
    if (endVerse !== '') cy.get('@content').find('span').contains(referenceToRegexp(endVerse));
}

/**
 * Verifies the header and content of the tooltip
 * @param {string} book Bible book name
 * @param {string} startChap Chapter number
 * @param {string} startVerse What verse to start reading from
 * @param {string} [endChap] Ending chapter number
 * @param {string} [endVerse] What verse to end reading at
 */
function testTooltip(book, startChap, startVerse, endChap = '', endVerse = '') {
    const bibleReference = biblePartsToReference(book, startChap, startVerse, endChap, endVerse);
    tooltipShowAndWaitForApi(bibleReference);
    tooltipHeaderVerify(book, startChap, startVerse, endChap, endVerse);
    tooltipContentVerify(startVerse, endVerse);
}

/**
 * Hovers the same verse twice and verifies the API request count
 * @param {string} bibleReference The bible reference to hover
 * @param {number} expectedCount The expected number of requests
 * @param {string} [containerSelector] The selector of the container to look in
 */
function verifyRequestCountAfterTwoHovers(bibleReference, expectedCount, containerSelector = 'body') {
    tooltipShow(bibleReference, containerSelector);
    cy.wait('@getRequest');
    unhoverTooltip();
    tooltipShow(bibleReference, containerSelector);
    cy.get(TOOLTIP_SELECTOR).should('exist');
    unhoverTooltip();
    cy.get('@getRequest.all').should('have.length', expectedCount);
}

/**
 * Stubs API responses by status and verifies final tooltip text
 * @param {number} statusCode HTTP status code to return
 * @param {string} expectedMessage Expected tooltip text
 */
function verifyErrorTooltipMessage(statusCode, expectedMessage) {
    cy.intercept('GET', API_ENDPOINT, {
        statusCode,
        body: {statusCode}
    }).as('getRequest');
    tooltipShow('John 4:24');
    cy.wait('@getRequest');
    cy.get(TOOLTIP_TEXT_SELECTOR).should('have.text', expectedMessage);
}

context('Tooltip', {retries: 1}, () => {
    beforeEach(() => {
        cy.visit(TEST_FILE);
    });

    describe('Tooltip Show', () => {
        beforeEach(() => {
            stubApiRequests();
        });

        const showCases = [
            {name: 'single chapter and single verse', text: 'John 4:24'},
            {name: 'single chapter and multiple verses', text: 'Gen 4:24-25'},
            {name: 'multiple chapters and multiple verses', text: 'Matt 4:24-5:3'},
            {name: 'Jude if chapter not provided', text: 'Jude 6'},
            {name: 'Jude if chapter is provided', text: 'Jude 1:7'},
            {name: 'roman numeral prefix', text: 'II Tim 3:16', containerSelector: '.roman-prefix-test'},
            {name: 'word prefix', text: 'First Kings 2:3', containerSelector: '.word-prefix-test'},
            {name: 'unicode en dash range', text: 'Gen 1:1–3', containerSelector: '.unicode-dash-test'},
        ];

        for (const testCase of showCases) {
            it(`Should show tooltip on hover of ${testCase.name}`, () => {
                tooltipShow(testCase.text, testCase.containerSelector);
            });
        }

        it('Should show tooltip for pre-existing link', () => {
            tooltipShow('Judges 14:22', '.keep-existing-link-test');
            unhoverTooltip();
            tooltipShow('Romans 12:2', '.keep-existing-link-test');
        });
        it('Should show tooltip for pre-existing link with nested HTML', () => {
            tooltipShow('Col 7:4', '.keep-existing-link-test-with-html');
        });
        it('Should not send another network request if one link is hovered twice', () => {
            verifyRequestCountAfterTwoHovers('John 4:24', 1);
        });
        it('Should not send another network request if two separate links to same bible verse are hovered', () => {
            cy.get(`div.duplicate-verse-test ${LINK_SELECTOR}`).eq(0).realHover();
            cy.wait('@getRequest');
            unhoverTooltip();
            cy.get(`div.duplicate-verse-test ${LINK_SELECTOR}`).eq(1).realHover();
            cy.get(TOOLTIP_SELECTOR).should('exist');
            unhoverTooltip();
            cy.get('@getRequest.all').should('have.length', 1);
        });
    });

    describe('Tooltip Content Verification', () => {
        beforeEach(() => {
            listenForApiRequests();
        });

        const contentCases = [
            {name: 'single chapter and single verse tooltip', args: ['John', '4', '24']},
            {name: 'single chapter and multiple verses tooltip', args: ['Gen', '4', '24', '', '25']},
            {name: 'multiple chapters and multiple verses tooltip', args: ['Matt', '4', '24', '5', '3']},
            {name: 'Jude if chapter not provided', args: ['Jude', '', '6']},
            {name: 'Jude if chapter is provided', args: ['Jude', '1', '7']},
        ];

        for (const testCase of contentCases) {
            it(`Should have matching content for ${testCase.name}`, () => {
                testTooltip(...testCase.args);
            });
        }

        it('Should request the expected endpoint for range references', () => {
            tooltipShow('Matt 4:24-5:3');
            cy.wait('@getRequest').its('request.url').should('match', /\/MAT\.4\.24-MAT\.5\.3$/);
        });

        it('Should request the expected endpoint for chapter-carried list item', () => {
            tooltipShow('8');
            cy.wait('@getRequest').its('request.url').should('match', /\/GAL\.3\.8-GAL\.3\.8$/);
        });
    });

    describe('Tooltip Error Handling', () => {
        const errorCases = [
            {status: 404, message: 'Verse does not exist'},
            {status: 400, message: "Request couldn't be completed, try again later"},
            {status: 500, message: 'Try again later'},
        ];

        for (const testCase of errorCases) {
            it(`Should show expected message for ${testCase.status} response`, () => {
                verifyErrorTooltipMessage(testCase.status, testCase.message);
            });
        }

        it('Should cache 404 responses and avoid a second request for same reference', () => {
            cy.intercept('GET', API_ENDPOINT, {
                statusCode: 404,
                body: {statusCode: 404}
            }).as('getRequest');
            verifyRequestCountAfterTwoHovers('John 4:24', 1);
        });

        it('Should retry 400 responses on second hover of same reference', () => {
            cy.intercept('GET', API_ENDPOINT, {
                statusCode: 400,
                body: {statusCode: 400}
            }).as('getRequest');
            verifyRequestCountAfterTwoHovers('John 4:24', 2);
        });

        it('Should retry 500 responses on second hover of same reference', () => {
            cy.intercept('GET', API_ENDPOINT, {
                statusCode: 500,
                body: {statusCode: 500}
            }).as('getRequest');
            verifyRequestCountAfterTwoHovers('John 4:24', 2);
        });
    });
});
