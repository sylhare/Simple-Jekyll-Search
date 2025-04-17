describe('Simple Jekyll Search', () => {
  it('Searching a Post', () => {
    cy.visit('/')

    cy.get('#search-input')
      .type('This')

    cy.get('#results-container')
      .contains('This is just a test')
  })

  it('Searching a Post follows link with query', () => {
    cy.visit('/')

    cy.get('#search-input')
      .type('This')

    cy.get('#results-container')
      .contains('This is just a test')
      .click()

    cy.url().should('include', '?query=This')
  })

  it('No results found', () => {
    cy.visit('/')

    cy.get('#search-input')
      .type('random')

    cy.get('#results-container')
      .contains('No results found')
  })
}) 