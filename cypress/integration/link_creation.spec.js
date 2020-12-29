const TEST_FILE = Cypress.env('testFile');

context('Link Creation', () => {
    beforeEach(() => {
        cy.visit(TEST_FILE);
    });

    /**
     * Verifies that a link is created for the given bible reference
     *
     * @param {string} bibleRef The bible reference to verify
     */
    function linkMatch(bibleRef) {
        cy.get('a.biblePreviewerLink').contains(new RegExp(`^${bibleRef}$`)).should('exist');
    }

    it('Should create link single chapter and single verse', () => linkMatch('John 4:24'));
    it('Should create link single chapter and multiple verses', () => linkMatch('John 4:24-25'));
    it('Should create link multiple chapters and multiple verses', () => linkMatch('John 4:24-5:3'));
});
