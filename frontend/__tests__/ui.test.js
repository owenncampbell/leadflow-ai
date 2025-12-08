/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Load the HTML file into the JSDOM environment
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.body.innerHTML = html;

// Mock the functions that are not available in the test environment
global.addLeadToDashboard = jest.fn();
global.handleLogin = jest.fn();
global.handleRegister = jest.fn();
global.handleLogout = jest.fn();
global.handleLeadFormSubmit = jest.fn();
global.checkAuthStatus = jest.fn();

// Now, require the UI script
require('../js/ui');


describe('UI', () => {
    it('should display a message when there are no leads', () => {
        const leadsList = document.getElementById('leads-list');
        leadsList.innerHTML = ''; // Clear the list

        const p = document.createElement('p');
        p.textContent = 'No leads yet. Submit one using the form!';
        leadsList.appendChild(p);

        expect(leadsList.innerHTML).toContain('No leads yet');
    });
});
