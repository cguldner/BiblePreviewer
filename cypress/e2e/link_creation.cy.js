const TEST_FILE = Cypress.env('testFile');
const LINK_SELECTOR = Cypress.env('linkSelector');
const CONTAINER_SELECTOR = Cypress.env('containerSelector');

context('Link Creation', () => {
    beforeEach(() => {
        cy.visit(TEST_FILE);
        cy.stubApiRequests();
    });

    /**
     * Verifies that a link is created for the given bible reference
     * @param {string} bibleRef The bible reference to verify
     * @param {string} containerSelector The selector of the container to look in
     */
    function linkMatch(bibleRef, containerSelector = 'body') {
        cy.get(containerSelector).find(LINK_SELECTOR).contains(new RegExp(`^\\s*${bibleRef}\\s*$`)).should('exist');
    }

    it('Should create link for single chapter and single verse', () => linkMatch('John 4:24'));
    it('Should create link for single chapter and multiple verses', () => linkMatch('Gen 4:24-25'));
    it('Should create link for multiple chapters and multiple verses', () => linkMatch('Matt 4:24-5:3'));
    it('Should create link for a list of single verses in the same chapter', () => {
        linkMatch('Gal 3:5');
        linkMatch('8');
    });
    it('Should create link for a list of multiple verses in the same chapter', () => {
        linkMatch('Joel 2:4', '.multiple-verse-same-chapter');
        linkMatch('9-10', '.multiple-verse-same-chapter');
    });
    it('Should create link for a list of multiple chapter:verse references in same book', () => {
        linkMatch('1 Cor 3:6');
        linkMatch('5:8');
    });
    it('Should create link for a reference where the chapter and verse are each 3 digits long', () => {
        linkMatch('Psalm 119:105');
    });
    it('Should create link for a list of multiple chapter:verse range references in same book', () => {
        linkMatch('Psalm 133:99-100');
        linkMatch('144:89-200');
    });
    it('Should create link for Jude if chapter not provided', () => linkMatch('Jude 6'));
    it('Should create link for Jude if chapter is provided', () => linkMatch('Jude 1:7'));
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
    it('Should create separate links for two different books', () => {
        linkMatch('Sirach 1:20');
        linkMatch('Song of Songs 4:3');
    });
    // Makes sure that in the case of something like Phil. 2:12, 1 Pet. 1:9,
    // the 1 matches to Peter and not to Philippians
    it('Should create link for bible passage with leading chapter number that follows another passage', () => {
        linkMatch('Phil. 2:12');
        linkMatch('1 Pet. 1:9');
    });
});
