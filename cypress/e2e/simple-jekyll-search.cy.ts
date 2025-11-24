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
      .type('xyzabc123notfound');

    cy.get('#results-container')
      .should('contain', 'No results found');
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

  describe('Hybrid Strategy with Highlighting', () => {
    it('should use literal search and highlight exact matches', () => {
      cy.get('#search-input')
        .type('Lorem');

      cy.get('#results-container')
        .should('be.visible');

      // Should find the "This is just a test" post
      cy.get('#results-container').contains('This is just a test').should('exist');

      cy.get('#results-container .search-desc .search-highlight')
        .should('exist')
        .should('have.css', 'background-color', 'rgb(255, 255, 0)');

      // Find highlights that contain Lorem (may be in multiple results)
      cy.get('#results-container .search-desc .search-highlight')
        .filter(':contains("Lorem")')
        .should('have.length.at.least', 1);
    });

    it('should use literal search for multi-word queries and highlight', () => {
      cy.get('#search-input')
        .type('Lorem ipsum');

      cy.get('#results-container')
        .should('be.visible');

      // Should find the "This is just a test" post
      cy.get('#results-container').contains('This is just a test').should('exist');

      cy.get('#results-container .search-desc .search-highlight')
        .should('have.length.at.least', 1);
      
      // Check that Lorem is highlighted somewhere in the results
      cy.get('#results-container .search-desc .search-highlight')
        .filter(':contains("Lorem")')
        .should('exist');
    });

    it('should handle different search patterns with hybrid strategy', () => {
      // Test single word search (uses fuzzy/literal)
      cy.get('#search-input')
        .clear()
        .type('ipsum');

      cy.get('#results-container li')
        .should('have.length.at.least', 1);
      
      cy.get('#results-container')
        .should('contain.text', 'ipsum');
    });

    it('should handle partial matches with hybrid strategy', () => {
      // Test another single word
      cy.get('#search-input')
        .clear()
        .type('technical');

      cy.get('#results-container li')
        .should('have.length.at.least', 1);
      
      cy.get('#results-container')
        .should('contain.text', 'Technical');
    });

    it('should highlight multiple occurrences in literal search', () => {
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