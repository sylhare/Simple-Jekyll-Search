describe('Back Navigation - Search State Persistence', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should preserve search input and results after navigating back from a result link', () => {
    const searchQuery = 'Lorem ipsum';
    
    cy.get('#search-input')
      .type(searchQuery);

    cy.get('#results-container')
      .should('be.visible')
      .contains('This is just a test')
      .should('exist');

    cy.get('#results-container').invoke('html').as('originalResults');

    cy.get('#results-container')
      .contains('This is just a test')
      .click();

    cy.url().should('include', '?query=Lorem%20ipsum');
    cy.url().should('not.eq', Cypress.config().baseUrl + '/');

    cy.go('back');

    cy.url().should('include', '/Simple-Jekyll-Search');

    cy.get('#search-input')
      .should('have.value', searchQuery);

    cy.get('#results-container')
      .should('be.visible')
      .should('not.be.empty');

    cy.get('#results-container')
      .contains('This is just a test')
      .should('exist');
  });

  it('should preserve highlighted search results after navigating back', () => {
    const searchQuery = 'Lorem';
    
    cy.get('#search-input')
      .type(searchQuery);

    cy.get('#results-container .search-desc .search-highlight')
      .should('exist');

    cy.get('#results-container a')
      .first()
      .click();

    cy.go('back');

    cy.get('#search-input')
      .should('have.value', searchQuery);

    cy.get('#results-container .search-desc .search-highlight')
      .should('exist');
  });
});
