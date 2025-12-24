const asyncHandler = require('express-async-handler');
const Lead = require('../models/Lead');
const aiService = require('../services/aiService');
const pdfService = require('../services/pdfService');

exports.getLeads = asyncHandler(async (req, res) => {
    const leads = await Lead.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(leads);
});

exports.analyzeLead = asyncHandler(async (req, res) => {
    const { projectDescription, clientName, clientEmail } = req.body;

    const aiOutput = await aiService.analyzeProject(projectDescription, clientName);

    const sanitizedMaterials = Array.isArray(aiOutput.materialList)
        ? aiOutput.materialList.filter(item => typeof item === 'string')
        : [];

    const sanitizedLabor = Array.isArray(aiOutput.laborBreakdown)
        ? aiOutput.laborBreakdown.filter(item => typeof item === 'string')
        : [];

    const newLead = new Lead({
        projectDescription,
        clientName,
        clientEmail,
        aiSummary: aiOutput.summary || 'N/A',
        aiCategory: aiOutput.category || 'N/A',
        aiCostEstimate: aiOutput.costEstimate || 'N/A',
        aiMaterialList: sanitizedMaterials,
        aiLaborBreakdown: sanitizedLabor,
        aiPermitRequired: aiOutput.permitRequired || 'N/A',
        aiDraftEmail: aiOutput.draftEmail || 'Could not generate email.',
        user: req.user.id,
    });

    const savedLead = await newLead.save();
    res.status(201).json(savedLead);
});

exports.updateLeadStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    const updatedLead = await Lead.findOneAndUpdate({ _id: id, user: req.user.id }, { status }, { new: true });

    if (!updatedLead) {
        res.status(404);
        throw new Error('Lead not found or you do not have permission to edit it.');
    }
    res.json(updatedLead);
});

exports.deleteLead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedLead = await Lead.findOneAndDelete({ _id: id, user: req.user.id });

    if (!deletedLead) {
        res.status(404);
        throw new Error('Lead not found or you do not have permission to delete it.');
    }
    res.status(200).json({ message: 'Lead deleted successfully.' });
});

exports.updateLeadEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const { id } = req.params;

    const updatedLead = await Lead.findOneAndUpdate({ _id: id, user: req.user.id }, { aiDraftEmail: email }, { new: true });

    if (!updatedLead) {
        res.status(404);
        throw new Error('Lead not found or you do not have permission to edit it.');
    }
    res.json(updatedLead);
});

exports.addLeadNote = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const { id } = req.params;

    if (!text || typeof text !== 'string') {
        res.status(400);
        throw new Error('Note text is required.');
    }

    const lead = await Lead.findOne({ _id: id, user: req.user.id });

    if (!lead) {
        res.status(404);
        throw new Error('Lead not found or you do not have permission to edit it.');
    }

    lead.notes = lead.notes || [];
    lead.notes.unshift({ text: text.trim() });
    await lead.save();

    res.status(201).json({ notes: lead.notes });
});

exports.setLeadReminder = asyncHandler(async (req, res) => {
    const { date, note } = req.body;
    const { id } = req.params;

    const lead = await Lead.findOne({ _id: id, user: req.user.id });
    if (!lead) {
        res.status(404);
        throw new Error('Lead not found or you do not have permission to edit it.');
    }

    let reminderDate = null;
    if (date) {
        const parsed = new Date(date);
        if (isNaN(parsed.getTime())) {
            res.status(400);
            throw new Error('Invalid reminder date.');
        }
        reminderDate = parsed;
    }

    lead.reminder = {
        date: reminderDate,
        note: typeof note === 'string' ? note.trim() : '',
    };
    await lead.save();

    res.json({ reminder: lead.reminder });
});

exports.generateProposal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const lead = await Lead.findOne({ _id: id, user: req.user.id });

    if (!lead) {
        res.status(404);
        throw new Error('Lead not found or you do not have permission to view it.');
    }

    const pdfBytes = await pdfService.generateProposalPdf(lead);

    res.setHeader('Content-Disposition', `attachment; filename="Proposal - ${lead.clientName}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBytes);
});
