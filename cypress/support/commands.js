const API_ENDPOINT = Cypress.env('apiEndpoint');

/**
 * Stub API requests to the bible endpoint, so they don't use up the request limit
 */
Cypress.Commands.add('stubApiRequests', () => {
    cy.intercept('GET', API_ENDPOINT, {fixture: 'bible_data.json'}).as('getRequest');
});


/**
 * Listen for the API requests to the bible endpoint, so they can be waited on later
 */
Cypress.Commands.add('listenForApiRequests', () => {
    cy.intercept('GET', API_ENDPOINT).as('getRequest');
});
