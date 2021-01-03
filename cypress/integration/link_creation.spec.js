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

    it('Should create link for single chapter and single verse', () => linkMatch('John 4:24'));
    it('Should create link for single chapter and multiple verses', () => linkMatch('Gen 4:24-25'));
    it('Should create link for multiple chapters and multiple verses', () => linkMatch('Matt 4:24-5:3'));
    it('Should create link for Jude', () => linkMatch('Jude 6'));
});
