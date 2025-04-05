describe('Simple Jekyll Search', () => {
  it('Searching a Post', () => {
    cy.visit('http://localhost:4000')

    cy.get('#search-input')
      .type('This')

    cy.get('#results-container')
      .contains('This is just a test')
  })

  it('Searching a Post follows link with query', () => {
    cy.visit('http://localhost:4000')

    cy.get('#search-input')
      .type('This')

    cy.get('#results-container')
      .contains('This is just a test')
      .click()

    cy.url().should('include', '?query=This')
  })

  it('No results found', () => {
    cy.visit('http://localhost:4000')

    cy.get('#search-input')
      .type('random')

    cy.get('#results-container')
      .contains('No results found')
  })
}) 