const express = require('express');
const path = require('path');
const cors = require('cors');
const OpenAI = require('openai');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// --- Database Connection ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schema & Model ---
const leadSchema = new mongoose.Schema({
    projectDescription: String,
    clientName: String,
    clientEmail: String,
    aiSummary: String,
    aiCategory: String,
    aiCostEstimate: String,
    aiMaterialList: [String],
    aiLaborBreakdown: [String],
    aiPermitRequired: String,
    aiDraftEmail: String,
    status: { type: String, default: 'New' },
    createdAt: { type: Date, default: Date.now }
});

const Lead = mongoose.model('Lead', leadSchema);

// --- Middleware ---
const corsOptions = {
    origin: 'https://shiftloopleads.netlify.app',
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));


// --- API Endpoints ---

// Get all leads
app.get('/api/leads', async (req, res) => {
    try {
        const leads = await Lead.find().sort({ createdAt: -1 });
        res.json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads.' });
    }
});

// Analyze and create a new lead
app.post('/api/analyze-lead', async (req, res) => {
    const { projectDescription, clientName, clientEmail } = req.body;

    if (!projectDescription || !clientName || !clientEmail) {
        return res.status(400).json({ error: 'Missing required lead information.' });
    }

    // A more detailed and explicit prompt for the AI
    const prompt = `You are an AI assistant for a contracting business. Analyze the project description below.

Project Description: "${projectDescription}"

Provide your response in a valid JSON format with the following keys:
- "summary": A concise summary of the project.
- "category": A category for the project (e.g., "Kitchen Remodel", "Deck Construction", "Fencing").
- "costEstimate": A rough, non-binding, ballpark cost estimate as a string (e.g., "$5,000 - $8,000").
- "materialList": An array of strings, listing potential materials. This MUST be an array of strings.
- "laborBreakdown": An array of strings, listing the major labor tasks. This MUST be an array of strings.
- "permitRequired": A string: "Yes", "No", or "Possibly".
- "draftEmail": A polite, professional email to the client named "${clientName}", confirming the project details and asking clarifying questions. Sign off as "LeadFlow AI Team".`;

    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const aiOutput = JSON.parse(chatCompletion.choices[0].message.content);

        // --- Data Sanitization ---
        // Ensure materialList is an array of strings
        const sanitizedMaterials = Array.isArray(aiOutput.materialList) 
            ? aiOutput.materialList.filter(item => typeof item === 'string') 
            : [];

        // Ensure laborBreakdown is an array of strings
        const sanitizedLabor = Array.isArray(aiOutput.laborBreakdown)
            ? aiOutput.laborBreakdown.filter(item => typeof item === 'string')
            : [];

        // Create a new lead document with sanitized data
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
        });

        // Save the lead to the database
        const savedLead = await newLead.save();
        res.status(201).json(savedLead);

    } catch (error) {
        console.error('Error in AI analysis or DB save:', error);
        res.status(500).json({ error: 'Failed to process lead.' });
    }
});

// Update a lead's status
app.put('/api/leads/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        const updatedLead = await Lead.findByIdAndUpdate(id, { status }, { new: true });

        if (!updatedLead) {
            return res.status(404).json({ error: 'Lead not found.' });
        }
        res.json(updatedLead);
    } catch (error) {
        console.error('Error updating lead status:', error);
        res.status(500).json({ error: 'Failed to update lead status.' });
    }
});

// Delete a lead
app.delete('/api/leads/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedLead = await Lead.findByIdAndDelete(id);

        if (!deletedLead) {
            return res.status(404).json({ error: 'Lead not found.' });
        }
        res.status(200).json({ message: 'Lead deleted successfully.' });
    } catch (error) {
        console.error('Error deleting lead:', error);
        res.status(500).json({ error: 'Failed to delete lead.' });
    }
});

// Update a lead's email
app.put('/api/leads/:id/email', async (req, res) => {
    try {
        const { email } = req.body;
        const { id } = req.params;

        const updatedLead = await Lead.findByIdAndUpdate(id, { aiDraftEmail: email }, { new: true });

        if (!updatedLead) {
            return res.status(404).json({ error: 'Lead not found.' });
        }
        res.json(updatedLead);
    } catch (error) {
        console.error('Error updating lead email:', error);
        res.status(500).json({ error: 'Failed to update lead email.' });
    }
});

// Generate a PDF proposal
app.get('/api/leads/:id/proposal', async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await Lead.findById(id);

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found.' });
        }

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let y = height - 50;

        // --- PDF Content ---
        page.drawText('Project Proposal', { x: 50, y, font: boldFont, size: 24 });
        y -= 40;

        page.drawText(`Client: ${lead.clientName}`, { x: 50, y, font, size: 12 });
        y -= 20;
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y, font, size: 12 });
        y -= 40;

        page.drawText('Project Summary', { x: 50, y, font: boldFont, size: 16 });
        y -= 25;
        page.drawText(lead.aiSummary, { x: 50, y, font, size: 12, maxWidth: width - 100, lineHeight: 15 });
        y -= 50;

        page.drawText('Scope of Work', { x: 50, y, font: boldFont, size: 16 });
        y -= 25;
        for (const item of lead.aiLaborBreakdown) {
            page.drawText(`- ${item}`, { x: 60, y, font, size: 12 });
            y -= 20;
        }
        y -= 30;

        page.drawText('Potential Materials', { x: 50, y, font: boldFont, size: 16 });
        y -= 25;
        for (const item of lead.aiMaterialList) {
            page.drawText(`- ${item}`, { x: 60, y, font, size: 12 });
            y -= 20;
        }
        y -= 30;

        page.drawText('Ballpark Cost Estimate', { x: 50, y, font: boldFont, size: 16 });
        y -= 25;
        page.drawText(lead.aiCostEstimate, { x: 50, y, font, size: 12 });

        const pdfBytes = await pdfDoc.save();

        res.setHeader('Content-Disposition', `attachment; filename="Proposal - ${lead.clientName}.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error('Error generating PDF proposal:', error);
        res.status(500).json({ error: 'Failed to generate PDF.' });
    }
});



// This middleware should be the last one.
// It catches all other routes and sends the index.html file.
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
