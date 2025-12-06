document.addEventListener('DOMContentLoaded', () => {
    const leadForm = document.getElementById('lead-form');
    const projectDescriptionInput = document.getElementById('project-description');
    const clientNameInput = document.getElementById('client-name');
    const clientEmailInput = document.getElementById('client-email');
    const formMessages = document.getElementById('form-messages');
    const leadsList = document.getElementById('leads-list');
    const API_URL = 'https://leadflow-ai-backend-1e2b.onrender.com/api';

    // --- Data Fetching and Rendering ---

    async function fetchAndDisplayLeads() {
        try {
            const response = await fetch(`${API_URL}/leads`);
            if (!response.ok) {
                throw new Error('Failed to fetch leads.');
            }
            const leads = await response.json();
            leadsList.innerHTML = ''; // Clear the list
            if (leads.length === 0) {
                leadsList.innerHTML = '<p>No leads yet. Submit one using the form!</p>';
            } else {
                leads.forEach(addLeadToDashboard);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
            leadsList.innerHTML = '<p style="color: red;">Could not load leads.</p>';
        }
    }

    function addLeadToDashboard(lead) {
        // Defaults for safety
        lead.status = lead.status || 'New';
        lead.aiMaterialList = lead.aiMaterialList || [];
        lead.aiLaborBreakdown = lead.aiLaborBreakdown || [];

        const leadItem = document.createElement('div');
        leadItem.className = 'lead-item collapsed'; // Add 'collapsed' class by default
        leadItem.id = `lead-${lead._id}`;
        leadItem.innerHTML = `
            <div class="lead-header">
                <h3>
                    ${lead.clientName} - ${lead.aiCategory || 'N/A'}
                    <span class="lead-status status-${lead.status.toLowerCase()}">${lead.status}</span>
                </h3>
                <button class="toggle-details-btn" aria-expanded="false">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
            <div class="lead-details">
                <div class="lead-status-changer">
                    <label for="status-select-${lead._id}">Change Status:</label>
                    <select id="status-select-${lead._id}" data-lead-id="${lead._id}">
                        <option value="New" ${lead.status === 'New' ? 'selected' : ''}>New</option>
                        <option value="Contacted" ${lead.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="Quoted" ${lead.status === 'Quoted' ? 'selected' : ''}>Quoted</option>
                        <option value="Won" ${lead.status === 'Won' ? 'selected' : ''}>Won</option>
                        <option value="Lost" ${lead.status === 'Lost' ? 'selected' : ''}>Lost</option>
                    </select>
                </div>
                <p><strong>Email:</strong> ${lead.clientEmail}</p>
                <p><strong>Original Request:</strong> ${lead.projectDescription}</p>
                <p><strong>AI Summary:</strong> ${lead.aiSummary || 'N/A'}</p>
                <p><strong>AI Cost Estimate:</strong> ${lead.aiCostEstimate || 'N/A'}</p>
                <div><strong>Potential Materials:</strong><ul>${lead.aiMaterialList.map(item => `<li>${item}</li>`).join('')}</ul></div>
                <div><strong>Labor Breakdown:</strong><ul>${lead.aiLaborBreakdown.map(item => `<li>${item}</li>`).join('')}</ul></div>
                <p><strong>Permit Required:</strong> ${lead.aiPermitRequired || 'N/A'}</p>
                <p><strong>AI Draft Email:</strong></p>
                <pre>${lead.aiDraftEmail || 'N/A'}</pre>
                <div class="lead-actions">
                    <button class="generate-proposal">Generate Proposal</button>
                    <button class="send-email">Send Email</button>
                    <button class="edit-email">Edit Email</button>
                    <button class="delete-lead">Delete</button>
                </div>
            </div>
        `;
        leadsList.appendChild(leadItem); // Use appendChild

        // --- Add Event Listeners ---

        // Toggle Details
        const toggleButton = leadItem.querySelector('.toggle-details-btn');
        toggleButton.addEventListener('click', () => {
            leadItem.classList.toggle('collapsed');
            const isExpanded = !leadItem.classList.contains('collapsed');
            toggleButton.setAttribute('aria-expanded', isExpanded);
        });
        
        // Status Changer
        const statusSelect = leadItem.querySelector('.lead-status-changer select');
        statusSelect.addEventListener('change', async (e) => {
            const newStatus = e.target.value;
            const leadId = e.target.dataset.leadId;
            await updateLeadStatus(leadId, newStatus, leadItem);
        });

        // Delete Lead
        const deleteButton = leadItem.querySelector('.delete-lead');
        deleteButton.addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete the lead for ${lead.clientName}?`)) {
                await deleteLead(lead._id, leadItem);
            }
        });

        // Edit/Save Email
        const editEmailButton = leadItem.querySelector('.edit-email');
        const emailPre = leadItem.querySelector('pre');
        editEmailButton.addEventListener('click', async () => {
            const isEditing = emailPre.isContentEditable;
            if (isEditing) {
                const newEmail = emailPre.textContent;
                await updateLeadEmail(lead._id, newEmail); // Save the email
                emailPre.contentEditable = false;
                editEmailButton.textContent = 'Edit Email';
                emailPre.classList.remove('is-editing');
            } else {
                emailPre.contentEditable = true;
                editEmailButton.textContent = 'Save Email';
                emailPre.focus();
                emailPre.classList.add('is-editing');
            }
        });

        // Send Email
        leadItem.querySelector('.send-email').addEventListener('click', () => {
            alert(`Simulating sending email to ${lead.clientName}.`);
        });

        // Generate Proposal
        const proposalButton = leadItem.querySelector('.generate-proposal');
        proposalButton.addEventListener('click', async () => {
            proposalButton.textContent = 'Generating...';
            proposalButton.disabled = true;
            await generateProposal(lead._id, lead.clientName);
            proposalButton.textContent = 'Generate Proposal';
            proposalButton.disabled = false;
        });
    }

    // --- API Interactions ---

    async function generateProposal(leadId, clientName) {
        try {
            const response = await fetch(`${API_URL}/leads/${leadId}/proposal`);
            if (!response.ok) throw new Error('Could not generate proposal.');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Proposal - ${clientName}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

        } catch (error) {
            console.error('Error generating proposal:', error);
            alert('Error: Could not generate proposal.');
        }
    }

    async function updateLeadStatus(leadId, status, leadItem) {
        try {
            const response = await fetch(`${API_URL}/leads/${leadId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!response.ok) throw new Error('Failed to update status.');
            
            // Update UI
            const leadStatusSpan = leadItem.querySelector('.lead-status');
            leadStatusSpan.textContent = status;
            leadStatusSpan.className = `lead-status status-${status.toLowerCase()}`;

        } catch (error) {
            console.error('Error updating status:', error);
            // Optionally revert UI change or show error to user
        }
    }

    async function deleteLead(leadId, leadItem) {
        try {
            const response = await fetch(`${API_URL}/leads/${leadId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete lead.');
            
            // Remove lead from UI
            leadItem.style.transition = 'opacity 0.5s ease';
            leadItem.style.opacity = '0';
            setTimeout(() => {
                leadItem.remove();
                if (leadsList.children.length === 0) {
                    leadsList.innerHTML = '<p>No leads yet. Submit one using the form!</p>';
                }
            }, 500);

        } catch (error) {
            console.error('Error deleting lead:', error);
            alert('Error: Could not delete lead.');
        }
    }

    async function updateLeadEmail(leadId, email) {
        try {
            const response = await fetch(`${API_URL}/leads/${leadId}/email`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!response.ok) throw new Error('Failed to save email.');
            alert('Email draft saved!');
        } catch (error) {
            console.error('Error saving email:', error);
            alert('Error: Could not save email draft.');
        }
    }

    leadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = leadForm.querySelector('button');
        submitButton.disabled = true;
        displayMessage('Analyzing lead...', 'info');

        try {
            const response = await fetch(`${API_URL}/analyze-lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectDescription: projectDescriptionInput.value,
                    clientName: clientNameInput.value,
                    clientEmail: clientEmailInput.value,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to analyze lead.');
            }
            
            displayMessage('Lead analyzed successfully!', 'success');
            leadForm.reset();
            await fetchAndDisplayLeads(); // Refetch all leads to show the new one

        } catch (error) {
            console.error('Error submitting lead:', error);
            displayMessage(error.message, 'error');
        } finally {
            submitButton.disabled = false;
        }
    });

    function displayMessage(message, type) {
        formMessages.textContent = message;
        formMessages.className = `form-messages ${type}`;
    }

    // --- Initial Load ---
    fetchAndDisplayLeads();
});
