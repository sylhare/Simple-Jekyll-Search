describe('Highlight Middleware', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should highlight search terms with default middleware', () => {
    cy.window().should('have.property', 'SimpleJekyllSearch');
    
    cy.get('#search-input').type('search');
    
    cy.get('#results-container', { timeout: 10000 }).should('not.be.empty');
    
    cy.get('#results-container')
      .find('.sjs-highlight')
      .should('exist')
      .and('contain', 'search');
    
    cy.get('#results-container')
      .find('.sjs-highlight')
      .should('have.length.at.least', 1);
  });

  it('should handle case insensitive search', () => {
    cy.get('#search-input').type('SEARCH');
    
    cy.get('#results-container').should('not.be.empty');
    
    cy.get('#results-container')
      .find('.sjs-highlight')
      .should('exist')
      .and('contain', 'search');
  });

  it('should highlight multiple search terms', () => {
    cy.get('#search-input').type('search test');
    
    cy.get('#results-container').should('not.be.empty');
    
    cy.get('#results-container')
      .find('.sjs-highlight')
      .should('exist');
  });

  it('should show context around matches', () => {
    cy.get('#search-input').type('test');
    
    cy.get('#results-container').should('not.be.empty');
    
    cy.get('#results-container')
      .find('.sjs-highlight')
      .should('exist')
      .and('contain', 'test');
    
    cy.get('#results-container')
      .find('.search-snippet')
      .should('contain.text', 'test')
      .and('not.have.text', 'test');
  });

  it('should clear results when search is cleared', () => {
    cy.get('#search-input').type('test');
    
    cy.get('#results-container').should('not.be.empty');
    
    cy.get('#search-input').clear();
    
    cy.get('#results-container').should('be.empty');
  });

  it('should handle empty search gracefully', () => {
    cy.get('#search-input').focus();
    
    cy.get('#results-container').should('be.empty');
  });

  it('should show no results for non-matching terms', () => {
    cy.get('#search-input').type('nonexistentterm');
    
    cy.get('#results-container')
      .should('contain', 'No results found');
  });
});
