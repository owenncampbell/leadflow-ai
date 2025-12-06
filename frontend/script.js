document.addEventListener('DOMContentLoaded', () => {
    const leadForm = document.getElementById('lead-form');
    const projectDescriptionInput = document.getElementById('project-description');
    const clientNameInput = document.getElementById('client-name');
    const clientEmailInput = document.getElementById('client-email');
    const formMessages = document.getElementById('form-messages');
    const leadsList = document.getElementById('leads-list');

    leadForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const projectDescription = projectDescriptionInput.value;
        const clientName = clientNameInput.value;
        const clientEmail = clientEmailInput.value;

        if (!projectDescription || !clientName || !clientEmail) {
            displayMessage('Please fill in all fields.', 'error');
            return;
        }

        displayMessage('Analyzing lead...', 'info'); // 'info' styling needs to be added to CSS

        try {
            const response = await fetch('https://leadflow-ai-backend-1e2b.onrender.com/api/analyze-lead', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ projectDescription, clientName, clientEmail }),
            });

            const data = await response.json();

            if (response.ok) {
                displayMessage('Lead analyzed successfully!', 'success');
                addLeadToDashboard(data); // Assume data contains processed lead info
                leadForm.reset();
            } else {
                displayMessage(data.error || 'Failed to analyze lead.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            displayMessage('An unexpected error occurred.', 'error');
        }
    });

    function displayMessage(message, type) {
        formMessages.textContent = message;
        formMessages.className = `form-messages ${type}`; // Update class for styling
    }

    function addLeadToDashboard(lead) {
        // Remove initial "No leads yet" message if present
        if (leadsList.querySelector('p')) {
            leadsList.innerHTML = '';
        }

        lead.status = lead.status || 'New'; // Default status to 'New'
        lead.aiMaterialList = lead.aiMaterialList || []; // Default to empty array
        lead.aiLaborBreakdown = lead.aiLaborBreakdown || []; // Default to empty array

        const leadItem = document.createElement('div');
        leadItem.className = 'lead-item';
        leadItem.innerHTML = `
            <h3>
                ${lead.clientName} - ${lead.aiCategory}
                <span class="lead-status status-${lead.status.toLowerCase()}">${lead.status}</span>
            </h3>
            <div class="lead-status-changer">
                <label for="status-select-${lead.id}">Change Status:</label>
                <select id="status-select-${lead.id}" data-lead-id="${lead.id}" disabled>
                    <option value="New" ${lead.status === 'New' ? 'selected' : ''}>New</option>
                    <option value="Contacted" ${lead.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                    <option value="Quoted" ${lead.status === 'Quoted' ? 'selected' : ''}>Quoted</option>
                    <option value="Won" ${lead.status === 'Won' ? 'selected' : ''}>Won</option>
                    <option value="Lost" ${lead.status === 'Lost' ? 'selected' : ''}>Lost</option>
                </select>
            </div>
            <p><strong>Email:</strong> ${lead.clientEmail}</p>
            <p><strong>Original Request:</strong> ${lead.projectDescription}</p>
            <p><strong>AI Summary:</strong> ${lead.aiSummary}</p>
            <p><strong>AI Cost Estimate:</strong> ${lead.aiCostEstimate}</p>
            <div>
                <strong>Potential Materials:</strong>
                <ul>
                    ${lead.aiMaterialList.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            <div>
                <strong>Labor Breakdown:</strong>
                <ul>
                    ${lead.aiLaborBreakdown.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            <p><strong>Permit Required:</strong> ${lead.aiPermitRequired}</p>
            <p><strong>AI Draft Email:</strong></p>
            <pre>${lead.aiDraftEmail}</pre>
            <div class="lead-actions">
                <button class="send-email" data-lead-id="${lead.id}">Send Email</button>
                <button class="edit-email" data-lead-id="${lead.id}">Edit Email</button>
            </div>
        `;
        const statusSelect = leadItem.querySelector('.lead-status-changer select');
        statusSelect.disabled = false; // Enable the dropdown

        statusSelect.addEventListener('change', (e) => {
            const newStatus = e.target.value;
            const leadStatusSpan = leadItem.querySelector('.lead-status');
            
            // Update the status text and class
            leadStatusSpan.textContent = newStatus;
            leadStatusSpan.className = `lead-status status-${newStatus.toLowerCase()}`;
        });

        const editEmailButton = leadItem.querySelector('.edit-email');
        const emailPre = leadItem.querySelector('pre');

        editEmailButton.addEventListener('click', () => {
            const isEditing = emailPre.isContentEditable;

            if (isEditing) {
                emailPre.contentEditable = false;
                editEmailButton.textContent = 'Edit Email';
                emailPre.classList.remove('is-editing');
                // Here you could add logic to save the updated email, e.g., send it to the backend
            } else {
                emailPre.contentEditable = true;
                emailPre.focus();
                editEmailButton.textContent = 'Save Email';
                emailPre.classList.add('is-editing');
            }
        });

        leadItem.querySelector('.send-email').addEventListener('click', () => {
            const editedEmail = emailPre.textContent;
            alert(`Simulating send email for lead: ${lead.clientName}\n\nEmail Body:\n${editedEmail}`);
            // Implement actual email sending logic here
        });
    }
});