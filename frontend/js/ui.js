import { updateLeadStatus, deleteLead, updateLeadEmail, generateProposal, addLeadNote, setLeadReminder } from './api.js';

export function addLeadToDashboard(lead) {
    // Defaults for safety
    lead.status = lead.status || 'New';
    lead.aiMaterialList = lead.aiMaterialList || [];
    lead.aiLaborBreakdown = lead.aiLaborBreakdown || [];
    lead.notes = lead.notes || [];
    lead.reminder = lead.reminder || { date: null, note: '' };

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

    const reminderBadge = createElement('span', 'reminder-badge none', 'No reminder');
    const setReminderBadge = () => {
        if (!lead.reminder || !lead.reminder.date) {
            reminderBadge.textContent = 'No reminder';
            reminderBadge.className = 'reminder-badge none';
            return;
        }
        const today = new Date();
        today.setHours(0,0,0,0);
        const date = new Date(lead.reminder.date);
        date.setHours(0,0,0,0);
        const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            reminderBadge.textContent = `Overdue • ${date.toLocaleDateString()}`;
            reminderBadge.className = 'reminder-badge overdue';
        } else if (diffDays === 0) {
            reminderBadge.textContent = `Due today`;
            reminderBadge.className = 'reminder-badge today';
        } else {
            reminderBadge.textContent = `Upcoming • ${date.toLocaleDateString()}`;
            reminderBadge.className = 'reminder-badge upcoming';
        }
    };
    setReminderBadge();

    h3.appendChild(statusSpan);
    h3.appendChild(reminderBadge);

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

    // Reminder
    const reminderSection = createElement('div', 'lead-reminder');
    const reminderLabel = createElement('p');
    reminderLabel.appendChild(createElement('strong', '', 'Reminder'));

    const reminderForm = createElement('form', 'lead-reminder-form');
    reminderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(reminderForm);
        const date = formData.get('reminderDate');
        const note = formData.get('reminderNote')?.toString().trim() || '';
        try {
            const { reminder } = await setLeadReminder(lead._id, { date, note });
            lead.reminder = reminder;
            setReminderBadge();
        } catch (err) {
            console.error('Failed to set reminder:', err);
            alert(err.message);
        }
    });

    const reminderDateInput = createElement('input');
    reminderDateInput.type = 'date';
    reminderDateInput.name = 'reminderDate';
    if (lead.reminder && lead.reminder.date) {
        const d = new Date(lead.reminder.date);
        reminderDateInput.value = d.toISOString().slice(0,10);
    }

    const reminderNoteInput = createElement('input');
    reminderNoteInput.type = 'text';
    reminderNoteInput.name = 'reminderNote';
    reminderNoteInput.placeholder = 'Optional note';
    reminderNoteInput.value = lead.reminder?.note || '';

    const reminderButton = createElement('button', 'set-reminder-btn', 'Save Reminder');
    reminderButton.type = 'submit';

    const clearReminder = createElement('button', 'clear-reminder-btn', 'Clear');
    clearReminder.type = 'button';
    clearReminder.addEventListener('click', async () => {
        try {
            const { reminder } = await setLeadReminder(lead._id, { date: null, note: '' });
            lead.reminder = reminder;
            setReminderBadge();
            reminderDateInput.value = '';
            reminderNoteInput.value = '';
        } catch (err) {
            console.error('Failed to clear reminder:', err);
            alert(err.message);
        }
    });

    reminderForm.append(reminderDateInput, reminderNoteInput, reminderButton, clearReminder);
    reminderSection.append(reminderLabel, reminderForm);

    // Notes
    const notesSection = createElement('div', 'lead-notes');
    const notesHeader = createElement('div', 'lead-notes-header');
    notesHeader.appendChild(createElement('strong', '', 'Notes'));
    const notesList = createElement('ul', 'lead-notes-list');
    const notesPlaceholder = createElement('p', 'lead-notes-empty', 'No notes yet.');

    const renderNotes = (notesArr) => {
        notesList.innerHTML = '';
        if (!notesArr || notesArr.length === 0) {
            notesPlaceholder.style.display = 'block';
            return;
        }
        notesPlaceholder.style.display = 'none';
        notesArr.forEach(note => {
            const li = createElement('li');
            const date = note.createdAt ? new Date(note.createdAt).toLocaleDateString() : '';
            li.innerHTML = `<span class="note-text">${note.text}</span>${date ? `<span class="note-date">${date}</span>` : ''}`;
            notesList.appendChild(li);
        });
    };

    renderNotes(lead.notes);

    const noteForm = createElement('form', 'lead-note-form');
    noteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(noteForm);
        const noteText = formData.get('noteText')?.toString().trim();
        if (!noteText) return;

        try {
            const { notes } = await addLeadNote(lead._id, noteText);
            lead.notes = notes;
            renderNotes(lead.notes);
            noteForm.reset();
        } catch (err) {
            console.error('Failed to add note:', err);
            alert(err.message);
        }
    });

    const noteInput = createElement('input');
    noteInput.type = 'text';
    noteInput.name = 'noteText';
    noteInput.placeholder = 'Add a follow-up note...';

    const noteButton = createElement('button', 'add-note-btn', 'Add Note');
    noteButton.type = 'submit';

    noteForm.append(noteInput, noteButton);
    notesSection.append(notesHeader, notesList, notesPlaceholder, noteForm);

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
        notesSection,
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

    sendButton.addEventListener('click', async () => {
        try {
            const updatedLead = await updateLeadStatus(lead._id, 'Contacted');
            const leadStatusSpan = leadItem.querySelector('.lead-status');
            leadStatusSpan.textContent = updatedLead.status;
            leadStatusSpan.className = `lead-status status-${updatedLead.status.toLowerCase()}`;
            statusSelect.value = updatedLead.status;
        } catch (err) {
            // Keep this non-blocking for now
            console.error('Failed to update status to Contacted:', err);
        }
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
