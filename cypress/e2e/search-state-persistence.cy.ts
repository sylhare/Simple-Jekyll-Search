describe('Search State Persistence (Cross-Browser)', () => {
  const STORAGE_KEY = 'sjs-search-state';

  beforeEach(() => {
    cy.visit('/');
    cy.window().then(win => win.sessionStorage.clear());
  });

  describe('sessionStorage integration', () => {
    it('stores search state with correct structure', () => {
      cy.get('#search-input').type('Lorem');
      cy.window().then(win => {
        const stored = win.sessionStorage.getItem(STORAGE_KEY);
        expect(stored).to.not.be.null;
        const state = JSON.parse(stored!);
        expect(state.query).to.equal('Lorem');
        expect(state.timestamp).to.be.a('number');
        expect(state.path).to.equal('/Simple-Jekyll-Search/');
      });
    });

    it('restores from sessionStorage when input is empty (Firefox scenario)', () => {
      cy.window().then(win => {
        win.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          query: 'Lorem ipsum',
          timestamp: Date.now(),
          path: '/Simple-Jekyll-Search/'
        }));
      });
      cy.reload();
      cy.get('#search-input').should('have.value', 'Lorem ipsum');
      cy.get('#results-container').should('not.be.empty');
    });

    it('clears storage when search is cleared', () => {
      cy.get('#search-input').type('Lorem');
      cy.window().then(win => {
        expect(win.sessionStorage.getItem(STORAGE_KEY)).to.not.be.null;
      });
      cy.get('#search-input').clear();
      cy.get('#search-input').type(' ').clear();
      cy.wait(200);
      cy.window().then(win => {
        expect(win.sessionStorage.getItem(STORAGE_KEY)).to.be.null;
      });
    });
  });

  describe('edge cases - corrupted/stale storage', () => {
    it('handles corrupted JSON gracefully', () => {
      cy.window().then(win => {
        win.sessionStorage.setItem(STORAGE_KEY, '{broken json');
      });
      cy.reload();
      cy.get('#search-input').should('have.value', '');
      cy.get('#results-container').should('be.empty');
      cy.get('#search-input').type('test');
      cy.get('#results-container').should('not.be.empty');
      cy.get('#search-input').clear();
      cy.window().should(win => {
        expect(win.sessionStorage.getItem(STORAGE_KEY)).to.be.null;
      });
    });

    it('ignores stale data (>30 min old)', () => {
      cy.window().then(win => {
        win.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          query: 'old query',
          timestamp: Date.now() - (31 * 60 * 1000),
          path: '/Simple-Jekyll-Search/'
        }));
      });
      cy.reload();
      cy.get('#search-input').should('have.value', '');
      cy.get('#results-container').should('be.empty');
      cy.get('#search-input').type('test');
      cy.get('#results-container').should('not.be.empty');
      cy.get('#search-input').clear();
      cy.window().should(win => {
        expect(win.sessionStorage.getItem(STORAGE_KEY)).to.be.null;
      });
    });

    it('ignores storage from different page path', () => {
      cy.window().then(win => {
        win.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          query: 'other page query',
          timestamp: Date.now(),
          path: '/different-page/'
        }));
      });
      cy.reload();
      cy.get('#search-input').should('have.value', '');
      cy.get('#search-input').type('test');
      cy.get('#results-container').should('not.be.empty');
      cy.get('#search-input').clear();
      cy.window().should(win => {
        expect(win.sessionStorage.getItem(STORAGE_KEY)).to.be.null;
      });
    });

    it('handles missing query field', () => {
      cy.window().then(win => {
        win.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          timestamp: Date.now(),
          path: '/Simple-Jekyll-Search/'
        }));
      });
      cy.reload();
      cy.get('#search-input').should('have.value', '');
    });

    it('handles non-string query field', () => {
      cy.window().then(win => {
        win.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          query: 12345,
          timestamp: Date.now(),
          path: '/Simple-Jekyll-Search/'
        }));
      });
      cy.reload();
      cy.get('#search-input').should('have.value', '');
    });
  });

  describe('back navigation flow', () => {
    it('preserves search input and results after navigating back from a result link', () => {
      const searchQuery = 'Lorem ipsum';
      cy.get('#search-input').type(searchQuery);
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
      cy.get('#search-input').should('have.value', searchQuery);
      cy.get('#results-container')
        .should('be.visible')
        .should('not.be.empty');
      cy.get('#results-container')
        .contains('This is just a test')
        .should('exist');
    });

    it('preserves highlighted search results after navigating back', () => {
      const searchQuery = 'Lorem';
      cy.get('#search-input').type(searchQuery);
      cy.get('#results-container .search-desc .search-highlight').should('exist');
      cy.get('#results-container a')
        .first()
        .click();
      cy.go('back');
      cy.get('#search-input').should('have.value', searchQuery);
      cy.get('#results-container .search-desc .search-highlight').should('exist');
    });
  });

  describe('data within valid threshold', () => {
    it('restores data that is 29 minutes old', () => {
      cy.window().then(win => {
        win.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          query: 'Lorem',
          timestamp: Date.now() - (29 * 60 * 1000),
          path: '/Simple-Jekyll-Search/'
        }));
      });
      cy.reload();
      cy.get('#search-input').should('have.value', 'Lorem');
      cy.get('#results-container').should('not.be.empty');
    });
  });
});
