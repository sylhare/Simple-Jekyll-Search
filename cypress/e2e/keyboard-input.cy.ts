describe('Keyboard Input', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should trigger search on non-whitelisted keys', () => {
    cy.get('#search-input').type('a');
    
    cy.get('#results-container').should('not.be.empty');
  });

  it('should not trigger search on whitelisted keys', () => {
    cy.get('#search-input').type('{enter}');
    cy.get('#results-container').should('be.empty');

    cy.get('#search-input').type('{uparrow}');
    cy.get('#results-container').should('be.empty');

    cy.get('#search-input').type('{shift}');
    cy.get('#results-container').should('be.empty');
  });

  it('should trigger search after typing non-whitelisted keys', () => {
    cy.get('#search-input')
      .type('{shift}')  // whitelisted
      .type('test')     // non-whitelisted
      .type('{enter}'); // whitelisted
    
    cy.get('#results-container').should('not.be.empty');
  });
}); 