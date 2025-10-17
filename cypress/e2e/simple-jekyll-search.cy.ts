describe('Simple Jekyll Search', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Searching a Post', () => {
    cy.get('#search-input')
      .type('This');

    cy.get('#results-container')
      .contains('This is just a test');
  });

  it('Searching a Post follows link with query', () => {
    cy.get('#search-input')
      .type('Lorem ipsum');

    cy.get('#results-container')
      .contains('This is just a test')
      .should('have.length', 1)
      .click();

    cy.url().should('include', '?query=Lorem%20ipsum');
  });

  it('No results found', () => {
    cy.get('#search-input')
      .type('random');

    cy.get('#results-container')
      .contains('No results found');
  });

  describe('Search Functionality Edge cases', () => {

    it('Searches for "sed -i hostname"', () => {
      cy.get('#search-input')
        .type('sed -i hostname');

      cy.get('#results-container')
        .contains('Technical Example')
        .should('exist');
    });

    it('Searches for "New York"', () => {
      cy.get('#search-input')
        .type('New York');

      cy.get('#results-container')
        .contains('Technical Example')
        .should('exist');
    });

    it('Searches for special characters', () => {
      cy.get('#search-input')
        .type('~!@#$%^&');

      cy.get('#results-container')
        .contains('Technical Example')
        .should('exist');
    });
  });

  describe('Highlighting Middleware', () => {
    it('should highlight search terms in results', () => {
      cy.get('#search-input')
        .type('Lorem');

      cy.get('#results-container')
        .should('be.visible');

      cy.get('#results-container .search-desc .search-highlight')
        .should('exist')
        .should('have.css', 'background-color', 'rgb(255, 255, 0)');

      cy.get('#results-container .search-desc .search-highlight')
        .first()
        .should('contain', 'Lorem');
    });

    it('should highlight multiple occurrences', () => {
      cy.get('#search-input')
        .type('test');

      cy.get('#results-container')
        .should('be.visible');

      cy.get('#results-container .search-desc .search-highlight')
        .should('have.length.at.least', 1);
    });

    it('should escape HTML in search results', () => {
      cy.get('#search-input')
        .type('sed');

      cy.get('#results-container')
        .should('be.visible');

      cy.get('#results-container .search-desc')
        .should('exist')
        .and('not.contain', '<script>');
    });
  });
});