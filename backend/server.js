const express = require('express');
const path = require('path');
const cors = require('cors');
const OpenAI = require('openai');
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


// This middleware should be the last one.
// It catches all other routes and sends the index.html file.
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
