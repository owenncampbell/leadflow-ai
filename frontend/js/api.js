import { getToken, logoutUser } from './auth.js';

export async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        logoutUser();
        throw new Error('Session expired. Please log in again.');
    }
    return response;
}

export async function loginUser(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
}

export async function registerUser(email, password) {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
}

export async function getAllLeads() {
    const response = await fetchWithAuth(`${API_URL}/leads`);
    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch leads.');
    }
    return await response.json();
}

export async function createLead(leadData) {
    const response = await fetchWithAuth(`${API_URL}/leads/analyze`, {
        method: 'POST',
        body: JSON.stringify(leadData),
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze lead.');
    }
    return await response.json();
}

export async function updateLeadStatus(leadId, status) {
    const response = await fetchWithAuth(`${API_URL}/leads/${leadId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update status.');
    return await response.json();
}

export async function deleteLead(leadId) {
    const response = await fetchWithAuth(`${API_URL}/leads/${leadId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete lead.');
    return await response.json();
}

export async function updateLeadEmail(leadId, email) {
    const response = await fetchWithAuth(`${API_URL}/leads/${leadId}/email`, {
        method: 'PUT',
        body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error('Failed to save email.');
    return await response.json();
}

export async function generateProposal(leadId) {
    const response = await fetchWithAuth(`${API_URL}/leads/${leadId}/proposal`);
    if (!response.ok) throw new Error('Could not generate proposal.');
    return await response.blob();
}

export async function addLeadNote(leadId, text) {
    const response = await fetchWithAuth(`${API_URL}/leads/${leadId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ text }),
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to add note.');
    }
    return await response.json();
}

export async function setLeadReminder(leadId, { date, note }) {
    const response = await fetchWithAuth(`${API_URL}/leads/${leadId}/reminder`, {
        method: 'PUT',
        body: JSON.stringify({ date, note }),
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to set reminder.');
    }
    return await response.json();
}
