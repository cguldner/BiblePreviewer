const TEST_FILE = Cypress.env('testFile');
const LINK_SELECTOR = Cypress.env('linkSelector');
const TOOLTIP_SELECTOR = Cypress.env('tooltipSelector');
const TOOLTIP_TEXT_SELECTOR = Cypress.env('tooltipTextSelector');

context('Tooltip', {retries: 1}, () => {
    beforeEach(() => {
        cy.visit(TEST_FILE);
    });

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
     *
     * @param {string} ref The part of the reference to turn into a word bounded regex
     * @returns {RegExp} A word bounded regex
     */
    function refToRegexp(ref) {
        return new RegExp(`\\b${ref}\\b`);
    }

    /**
     * Turns the parts of the bible reference into a full reference
     *
     * @param {string} book Bible book name
     * @param {string} startChap Chapter number
     * @param {string} startVerse What verse to start reading from
     * @param {string} [endChap] Ending chapter number
     * @param {string} [endVerse] What verse to end reading at
     * @returns {string} The full bible reference
     */
    function biblePartsToRef(book, startChap, startVerse, endChap = '', endVerse = '') {
        let bibleRef = `${book}\\s`;
        if (startChap !== '') {
            bibleRef += `${startChap}:`;
        }
        bibleRef += startVerse;
        if (endChap !== '' || endVerse !== '') {
            bibleRef += '-';
            if (endChap) {
                bibleRef += `${endChap}:`;
            }
            bibleRef += endVerse;
        }
        return bibleRef;
    }

    /**
     * Verifies that a tooltip is created for the given bible reference when hovered
     *
     * @param {string} bibleRef The bible reference to verify
     * @param {string} [containerSelector=body] The selector of the container to look in
     */
    function tooltipShow(bibleRef, containerSelector = 'body') {
        cy.get(containerSelector).find(TOOLTIP_SELECTOR).should('not.exist');
        cy.get(containerSelector).find(LINK_SELECTOR).contains(new RegExp(`^${bibleRef}$`)).should('exist').realHover();
        cy.get(containerSelector).find(TOOLTIP_SELECTOR).should('exist').should('be.visible');
    }

    /**
     * Hovers the specified verse and waits for the corresponding API request to complete
     *
     * @param {string} bibleRef The bible reference to hover
     */
    function tooltipShowAndWaitForApi(bibleRef) {
        tooltipShow(bibleRef);
        cy.wait('@getRequest');
    }

    /**
     * Unhovers the tooltip, and waits for it to disappear
     */
    function unhoverTooltip() {
        cy.get('body').realHover();
        // Wait until the tooltip disappears
        cy.get(TOOLTIP_SELECTOR).should('not.exist');
    }

    describe('Tooltip Show', () => {
        beforeEach(() => {
            stubApiRequests();
        });

        it('Should show tooltip on hover of single chapter and single verse', () => tooltipShow('John 4:24'));
        it('Should show tooltip on hover of single chapter and multiple verses', () => tooltipShow('Gen 4:24-25'));
        it('Should show tooltip on hover of multiple chapters and multiple verses', () => tooltipShow('Matt 4:24-5:3'));
        it('Should show tooltip on hover of Jude if chapter not provided', () => tooltipShow('Jude 6'));
        it('Should show tooltip on hover of Jude if chapter is provided', () => tooltipShow('Jude 1:7'));
        it('Should show tooltip for pre-existing link', () => {
            tooltipShow('Judges 14:22', '.keep-existing-link-test');
            unhoverTooltip();
            tooltipShow('Romans 12:2', '.keep-existing-link-test');
        });
        it('Should show tooltip for pre-existing link with nested HTML', () => {
            tooltipShow('Col 7:4', '.keep-existing-link-test-with-html');
        });
        it('Should not send another network request if one link is hovered twice', () => {
            const verse = /^John 4:24$/;
            cy.get(LINK_SELECTOR).contains(verse).realHover();
            cy.wait('@getRequest');
            unhoverTooltip();
            cy.get(LINK_SELECTOR).contains(verse).realHover();
            cy.get(TOOLTIP_SELECTOR).should('exist');
            unhoverTooltip();
            cy.get('@getRequest.all').should('have.length', 1);
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

        /**
         * Verifies that the tooltip header has the correct information
         *
         * @param {string} book Bible book name
         * @param {string} startChap Chapter number
         * @param {string} startVerse What verse to start reading from
         * @param {string} [endChap] Ending chapter number
         * @param {string} [endVerse] What verse to end reading at
         */
        function tooltipHeaderVerify(book, startChap, startVerse, endChap = '', endVerse = '') {
            cy.get(`${TOOLTIP_SELECTOR} .bpHeaderBar`).should('exist')
                .contains(new RegExp(`\\b${book}`))
                .contains(refToRegexp(startChap))
                .contains(refToRegexp(startVerse))
                .contains(refToRegexp(endChap))
                .contains(refToRegexp(endVerse));
        }

        /**
         * Verifies that the tooltip content has the correct information
         *
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
            cy.get('@content').find('span').contains(refToRegexp(startVerse));
            if (endVerse !== '') cy.get('@content').find('span').contains(refToRegexp(endVerse));
        }

        /**
         * Verifies the header and content of the tooltip
         *
         * @param {string} book Bible book name
         * @param {string} startChap Chapter number
         * @param {string} startVerse What verse to start reading from
         * @param {string} [endChap] Ending chapter number
         * @param {string} [endVerse] What verse to end reading at
         */
        function testTooltip(book, startChap, startVerse, endChap = '', endVerse = '') {
            const bibleRef = biblePartsToRef(book, startChap, startVerse, endChap, endVerse);
            tooltipShowAndWaitForApi(bibleRef);
            tooltipHeaderVerify(book, startChap, startVerse, endChap, endVerse);
            tooltipContentVerify(startVerse, endVerse);
        }

        it('Should have matching content for single chapter and single verse tooltip', () => testTooltip('John', '4', '24'));
        it('Should have matching content for single chapter and multiple verses tooltip', () => testTooltip('Gen', '4', '24', '', '25'));
        it('Should have matching content for multiple chapters and multiple verses tooltip', () => testTooltip('Matt', '4', '24', '5', '3'));
        it('Should have matching content for Jude if chapter not provided', () => testTooltip('Jude', '', '6'));
        it('Should have matching content for Jude if chapter is provided', () => testTooltip('Jude', '1', '7'));
    });
});
