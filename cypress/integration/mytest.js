describe('Delete handler test', () => {
  it('Visit', () => {
    cy.visit('http://localhost:4200');
    cy.contains('Dummy');
  });
  it('Delete letters works', () => {
    cy.visit('http://localhost:4200');
    cy.get('body').type('Capybaras');
    cy.get('body').type('{backspace}');
    cy.get('div[contenteditable]').should('have.text', 'Capybara');
  });
});

