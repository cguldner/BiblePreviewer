const TEST_FILE = Cypress.env('testFile');
const API_ENDPOINT = '**/api.scripture.api.bible/v1/**';

context('Tooltip', {retries: 1}, () => {
    beforeEach(() => {
        cy.visit(TEST_FILE);
        cy.intercept('GET', API_ENDPOINT).as('getRequest');
    });

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
     * Unhovers the tooltip, and waits for it to disappear
     */
    function unhoverTooltip() {
        cy.get('body').realHover();
        // Wait until the tooltip disappears
        cy.get('.biblePreviewerTooltip').should('not.exist');
    }

    describe('Tooltip Show', () => {
        /**
         * Verifies that a tooltip is created for the given bible reference when hovered
         *
         * @param {string} bibleRef The bible reference to verify
         */
        function tooltipShow(bibleRef) {
            cy.get('.biblePreviewerTooltip').should('not.exist');
            cy.get('a.biblePreviewerLink').contains(new RegExp(`^${bibleRef}$`)).should('exist');
            cy.get('a.biblePreviewerLink').contains(new RegExp(`^${bibleRef}$`)).realHover();
            cy.get('.biblePreviewerTooltip').should('exist');
        }

        it('Should show tooltip on hover of single chapter and single verse', () => tooltipShow('John 4:24'));
        it('Should show tooltip on hover of single chapter and multiple verses', () => tooltipShow('Gen 4:24-25'));
        it('Should show tooltip on hover of multiple chapters and multiple verses', () => tooltipShow('Matt 4:24-5:3'));
        it('Should show tooltip on hover of Jude', () => tooltipShow('Jude 6'));
        it('Should not send another network request if one link is hovered twice', () => {
            const verse = /^John 4:24$/;
            cy.get('a.biblePreviewerLink').contains(verse).realHover();
            cy.wait('@getRequest');
            unhoverTooltip();
            cy.intercept('GET', API_ENDPOINT).as('getRequest2');
            cy.get('a.biblePreviewerLink').contains(verse).realHover();
            cy.get('.biblePreviewerTooltip').should('exist');
            unhoverTooltip();
            cy.get('@getRequest2').should('not.exist');
        });
        it('Should not send another network request if two separate links to same bible verse are hovered', () => {
            // Index should be equal to the index of the Ex 19:20 verse in the test.html
            const index = 4;
            cy.get('a.biblePreviewerLink').eq(index).realHover();
            cy.wait('@getRequest');
            unhoverTooltip();
            cy.intercept('GET', API_ENDPOINT).as('getRequest2');
            cy.get('a.biblePreviewerLink').eq(index + 1).realHover();
            cy.get('.biblePreviewerTooltip').should('exist');
            unhoverTooltip();
            cy.get('@getRequest2').should('not.exist');
        });
    });

    describe('Tooltip Header Verification', () => {
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
            const bibleRef = biblePartsToRef(book, startChap, startVerse, endChap, endVerse);
            cy.get('a.biblePreviewerLink').contains(new RegExp(`^${bibleRef}$`)).realHover();
            cy.get('.biblePreviewerTooltip .bpHeaderBar').should('exist')
                .contains(new RegExp(`\\b${book}`))
                .contains(refToRegexp(startChap))
                .contains(refToRegexp(startVerse))
                .contains(refToRegexp(endChap))
                .contains(refToRegexp(endVerse));
        }

        it('Should have matching header for single chapter and single verse tooltip', () => tooltipHeaderVerify('John', '4', '24'));
        it('Should have matching header for single chapter and multiple verses tooltip', () => tooltipHeaderVerify('Gen', '4', '24', '', '25'));
        it('Should have matching header for multiple chapters and multiple verses tooltip', () => tooltipHeaderVerify('Matt', '4', '24', '5', '3'));
        it('Should have matching header for Jude', () => tooltipHeaderVerify('Jude', '', '6'));
    });

    describe('Tooltip Content Verification', () => {
        /**
         * Verifies that the tooltip header has the correct information
         *
         * @param {string} book Bible book name
         * @param {string} startChap Chapter number
         * @param {string} startVerse What verse to start reading from
         * @param {string} [endChap] Ending chapter number
         * @param {string} [endVerse] What verse to end reading at
         */
        function tooltipContentVerify(book, startChap, startVerse, endChap = '', endVerse = '') {
            const bibleRef = biblePartsToRef(book, startChap, startVerse, endChap, endVerse);
            cy.get('a.biblePreviewerLink').contains(new RegExp(`^${bibleRef}$`)).realHover();
            cy.wait('@getRequest');
            cy.get('.bpTooltipContent').as('content')
                .should('exist')
                .invoke('text')
                .should('not.equal', 'Loading')
                .should('not.equal', 'Verse does not exist')
                .should('not.equal', 'Try again later');
            // cy.get('@content').find('span').contains(refToRegexp(startChap));
            cy.get('@content').find('span').contains(refToRegexp(startVerse));
            // if (endChap !== '') cy.get('@content').find('span').contains(refToRegexp(endChap));
            if (endVerse !== '') cy.get('@content').find('span').contains(refToRegexp(endVerse));
        }

        it('Should have matching content for single chapter and single verse tooltip', () => tooltipContentVerify('John', '4', '24'));
        it('Should have matching content for single chapter and multiple verses tooltip', () => tooltipContentVerify('Gen', '4', '24', '', '25'));
        it('Should have matching content for multiple chapters and multiple verses tooltip', () => tooltipContentVerify('Matt', '4', '24', '5', '3'));
        it('Should have matching content for Jude', () => tooltipContentVerify('Jude', '', '6'));
    });
});
