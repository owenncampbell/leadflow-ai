import { updateLeadStatus, deleteLead, updateLeadEmail, generateProposal } from './api.js';

export function addLeadToDashboard(lead) {
    // Defaults for safety
    lead.status = lead.status || 'New';
    lead.aiMaterialList = lead.aiMaterialList || [];
    lead.aiLaborBreakdown = lead.aiLaborBreakdown || [];

    const leadItem = document.createElement('div');
    leadItem.className = 'lead-item collapsed';
    leadItem.id = `lead-${lead._id}`;

    // --- Helper function to create elements ---
    function createElement(tag, className, textContent) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (textContent) el.textContent = textContent;
        return el;
    }

    // --- Lead Header ---
    const leadHeader = createElement('div', 'lead-header');
    const h3 = createElement('h3', '', `${lead.clientName} - ${lead.aiCategory || 'N/A'}`);
    const statusSpan = createElement('span', `lead-status status-${lead.status.toLowerCase()}`, lead.status);
    h3.appendChild(statusSpan);

    const toggleButton = createElement('button', 'toggle-details-btn');
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>`;
    
    leadHeader.append(h3, toggleButton);

    // --- Lead Details ---
    const leadDetails = createElement('div', 'lead-details');

    // Status Changer
    const statusChanger = createElement('div', 'lead-status-changer');
    const statusLabel = createElement('label', '', 'Change Status:');
    statusLabel.htmlFor = `status-select-${lead._id}`;
    const statusSelect = createElement('select');
    statusSelect.id = `status-select-${lead._id}`;
    statusSelect.dataset.leadId = lead._id;
    ['New', 'Contacted', 'Quoted', 'Won', 'Lost'].forEach(status => {
        const option = createElement('option', '', status);
        option.value = status;
        if (lead.status === status) option.selected = true;
        statusSelect.appendChild(option);
    });
    statusChanger.append(statusLabel, statusSelect);

    // Simple Paragraphs
    const createDetailLine = (label, value) => {
        const p = createElement('p');
        const strong = createElement('strong', '', `${label}:`);
        p.appendChild(strong);
        p.append(` ${value || 'N/A'}`);
        return p;
    };

    // List builder
    const createList = (label, items) => {
        const div = createElement('div');
        const strong = createElement('strong', '', `${label}:`);
        div.appendChild(strong);
        const ul = createElement('ul');
        items.forEach(itemText => {
            const li = createElement('li', '', itemText);
            ul.appendChild(li);
        });
        div.appendChild(ul);
        return div;
    };

    const emailP = createDetailLine('Email', lead.clientEmail);
    const requestP = createDetailLine('Original Request', lead.projectDescription);
    const summaryP = createDetailLine('AI Summary', lead.aiSummary);
    const costP = createDetailLine('AI Cost Estimate', lead.aiCostEstimate);
    const materialsDiv = createList('Potential Materials', lead.aiMaterialList);
    const laborDiv = createList('Labor Breakdown', lead.aiLaborBreakdown);
    const permitP = createDetailLine('Permit Required', lead.aiPermitRequired);
    
    const emailDraftLabel = createElement('p');
    emailDraftLabel.appendChild(createElement('strong', '', 'AI Draft Email:'));
    const emailPre = createElement('pre', '', lead.aiDraftEmail || 'N/A');

    // --- Lead Actions ---
    const leadActions = createElement('div', 'lead-actions');
    const proposalButton = createElement('button', 'generate-proposal', 'Generate Proposal');
    const sendButton = createElement('button', 'send-email', 'Send Email');
    const editEmailButton = createElement('button', 'edit-email', 'Edit Email');
    const deleteButton = createElement('button', 'delete-lead', 'Delete');
    leadActions.append(proposalButton, sendButton, editEmailButton, deleteButton);

    leadDetails.append(
        statusChanger,
        emailP,
        requestP,
        summaryP,
        costP,
        materialsDiv,
        laborDiv,
        permitP,
        emailDraftLabel,
        emailPre,
        leadActions
    );
    
    leadItem.append(leadHeader, leadDetails);
    document.getElementById('leads-list').appendChild(leadItem);

    // --- Add Event Listeners ---
    const toggleDetails = () => {
        leadItem.classList.toggle('collapsed');
        const isExpanded = !leadItem.classList.contains('collapsed');
        toggleButton.setAttribute('aria-expanded', isExpanded);
    };

    toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDetails();
    });

    // Allow clicking the header (not just the arrow) to toggle
    leadHeader.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        toggleDetails();
    });

    // When collapsed, clicking anywhere on the card (except controls) expands it
    leadItem.addEventListener('click', (e) => {
        if (!leadItem.classList.contains('collapsed')) return;
        if (e.target.closest('button, select, option, input, textarea, a')) return;
        toggleDetails();
    });

    statusSelect.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        const updatedLead = await updateLeadStatus(lead._id, newStatus);
        const leadStatusSpan = leadItem.querySelector('.lead-status');
        leadStatusSpan.textContent = updatedLead.status;
        leadStatusSpan.className = `lead-status status-${updatedLead.status.toLowerCase()}`;
    });

    deleteButton.addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete the lead for ${lead.clientName}?`)) {
            await deleteLead(lead._id);
            leadItem.remove();
        }
    });

    editEmailButton.addEventListener('click', async () => {
        const isEditing = emailPre.isContentEditable;
        if (isEditing) {
            await updateLeadEmail(lead._id, emailPre.textContent);
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

    sendButton.addEventListener('click', () => {
        alert(`Simulating sending email to ${lead.clientName}.`);
    });

    proposalButton.addEventListener('click', async () => {
        proposalButton.textContent = 'Generating...';
        proposalButton.disabled = true;
        const blob = await generateProposal(lead._id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `Proposal - ${lead.clientName}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        proposalButton.textContent = 'Generate Proposal';
        proposalButton.disabled = false;
    });
}

export function displayMessage(message, type) {
    const formMessages = document.getElementById('form-messages');
    formMessages.textContent = message;
    formMessages.className = `form-messages ${type}`;
}
