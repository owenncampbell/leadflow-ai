import { getToken, setToken, logoutUser } from './js/auth.js';
import { loginUser, registerUser, getAllLeads, createLead } from './js/api.js';
import { addLeadToDashboard, displayMessage } from './js/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let state = {
        user: null,
        token: null,
        leads: [],
        error: null,
        loading: true,
    };

    // --- DOM Elements ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutButton = document.getElementById('logout-button');
    const leadForm = document.getElementById('lead-form');
    const leadsList = document.getElementById('leads-list');
    const authSection = document.getElementById('auth-section');
    const mainContent = document.getElementById('main-content');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const passwordInput = document.getElementById('register-password');
    const confirmPasswordInput = document.getElementById('register-confirm-password');
    const passwordMatchMessage = document.getElementById('password-match-message');

    // --- State Modifier ---
    function setState(newState) {
        state = { ...state, ...newState };
        render();
    }

    // --- Render Function ---
    function render() {
        const { user, leads, loading } = state;

        // Render auth state
        if (user) {
            authSection.style.display = 'none';
            mainContent.style.display = 'grid';
            logoutButton.style.display = 'block';
        } else {
            authSection.style.display = 'block';
            mainContent.style.display = 'none';
            logoutButton.style.display = 'none';
        }

        // Render leads
        leadsList.innerHTML = ''; // Clear the list
        if (loading) {
            leadsList.innerHTML = '<p>Loading...</p>';
            return;
        }

        if (leads.length === 0) {
            leadsList.innerHTML = '<p>No leads yet. Submit one using the form!</p>';
        } else {
            leads.forEach(lead => addLeadToDashboard(lead));
        }
    }

    // --- Event Listeners ---
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutButton.addEventListener('click', handleLogout);
    leadForm.addEventListener('submit', handleLeadFormSubmit);
    
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'grid';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'grid';
        registerForm.style.display = 'none';
    });

    function validatePasswordMatch() {
        if (passwordInput.value !== confirmPasswordInput.value) {
            passwordMatchMessage.textContent = 'Passwords do not match';
            passwordMatchMessage.className = 'error';
        } else {
            passwordMatchMessage.textContent = 'Passwords match';
            passwordMatchMessage.className = 'success';
        }
    }

    passwordInput.addEventListener('input', validatePasswordMatch);
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    
    // --- Initial Load ---
    checkAuthStatus();

    // --- Auth Handlers ---
    async function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            const { token } = await loginUser(email, password);
            setToken(token);
            setState({ user: { email }, token });
            await fetchAndDisplayLeads();
        } catch (error) {
            alert(error.message);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            return;
        }

        try {
            const { token } = await registerUser(email, password);
            setToken(token);
            setState({ user: { email }, token });
            await fetchAndDisplayLeads();
        } catch (error) {
            alert(error.message);
        }
    }

    function handleLogout() {
        logoutUser();
        setState({ user: null, token: null, leads: [] });
    }

    async function checkAuthStatus() {
        const token = getToken();
        if (token) {
            setState({ user: { token }, token });
            await fetchAndDisplayLeads();
        } else {
            setState({ user: null, token: null, loading: false });
        }
    }

    // --- Lead Form Handler ---
    async function handleLeadFormSubmit(e) {
        e.preventDefault();
        const projectDescription = document.getElementById('project-description').value;
        const clientName = document.getElementById('client-name').value;
        const clientEmail = document.getElementById('client-email').value;
        
        displayMessage('Analyzing lead...', 'info');

        try {
            const newLead = await createLead({ projectDescription, clientName, clientEmail });
            setState({ leads: [newLead, ...state.leads] });
            displayMessage('Lead analyzed successfully!', 'success');
            leadForm.reset();
        } catch (error) {
            displayMessage(error.message, 'error');
        }
    }
    
    async function fetchAndDisplayLeads() {
        setState({ loading: true });
        try {
            const leads = await getAllLeads();
            setState({ leads, loading: false });
        } catch (error) {
            setState({ error: error.message, loading: false });
        }
    }
});
