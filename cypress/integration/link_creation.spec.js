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
    it('Should create link for Jude if chapter not provided', () => linkMatch('Jude 6'));
    it('Should create link for Jude if chapter is provided', () => linkMatch('Jude 1:7'));
    it('Should not overwrite existing links', () => {
        // At least wait until bible links have started appearing
        cy.get('a.biblePreviewerLink').should('exist');
        cy.get('.keep-existing-link-test').find('a.biblePreviewerLink').should('not.exist');
    });
    // Makes sure that in the case of something like Phil. 2:12, 1 Pet. 1:9,
    // the 1 matches to Peter and not to Philippians
    it('Should create link for bible passage with leading chapter number that follows another passage', () => {
        linkMatch('Phil. 2:12');
        linkMatch('1 Pet. 1:9');
    });
});
