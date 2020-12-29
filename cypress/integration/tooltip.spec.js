const TEST_FILE = Cypress.env('testFile');

context('Tooltip', () => {
    beforeEach(() => {
        cy.visit(TEST_FILE);
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
        let bibleRef = `${book}\\s${startChap}:${startVerse}`;
        if (endChap !== '' || endVerse !== '') {
            bibleRef += '-';
            if (endChap) {
                bibleRef += `${endChap}:`;
            }
            bibleRef += endVerse;
        }
        return bibleRef;
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
        it('Should show tooltip on hover of single chapter and multiple verses', () => tooltipShow('John 4:24-25'));
        it('Should show tooltip on hover of multiple chapters and multiple verses', () => tooltipShow('John 4:24-5:3'));
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
                .contains(refToRegexp(book))
                .contains(refToRegexp(startChap))
                .contains(refToRegexp(startVerse))
                .contains(refToRegexp(endChap))
                .contains(refToRegexp(endVerse));
        }

        it('Should have matching header for single chapter and single verse tooltip', () => tooltipHeaderVerify('John', '4', '24'));
        it('Should have matching header for single chapter and multiple verses tooltip', () => tooltipHeaderVerify('John', '4', '24', '', '25'));
        it('Should have matching header for multiple chapters and multiple verses tooltip', () => tooltipHeaderVerify('John', '4', '24', '5', '3'));
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
            // Header doesn't appear until request has finished
            cy.get('.biblePreviewerTooltip .bpHeaderBar').should('exist');
            cy.get('.biblePreviewerTooltip .bpTooltipContent').as('content')
                .should('exist')
                .should('not.have.text', /Loading/i)
                .should('not.have.text', /Verse does not exist/i)
                .should('not.have.text', /Try again later/i);
            // cy.get('@content').find('span').contains(refToRegexp(startChap));
            cy.get('@content').find('span').contains(refToRegexp(startVerse));
            // if (endChap !== '') cy.get('@content').find('span').contains(refToRegexp(endChap));
            if (endVerse !== '') cy.get('@content').find('span').contains(refToRegexp(endVerse));
        }

        it('Should have matching content for single chapter and single verse tooltip', () => tooltipContentVerify('John', '4', '24'));
        it('Should have matching content for single chapter and multiple verses tooltip', () => tooltipContentVerify('John', '4', '24', '', '25'));
        it('Should have matching content for multiple chapters and multiple verses tooltip', () => tooltipContentVerify('John', '4', '24', '5', '3'));
    });
});
