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
    
    // AI Analysis Logic...
    const prompt = `You are an AI assistant for a contracting business...`; // Keeping prompt brief for this example
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: `Analyze: "${projectDescription}" and provide JSON with keys: summary, category, costEstimate, materialList, laborBreakdown, permitRequired, draftEmail.` }],
            response_format: { type: "json_object" },
        });

        const aiOutput = JSON.parse(chatCompletion.choices[0].message.content);

        // Create a new lead document
        const newLead = new Lead({
            projectDescription,
            clientName,
            clientEmail,
            aiSummary: aiOutput.summary,
            aiCategory: aiOutput.category,
            aiCostEstimate: aiOutput.costEstimate,
            aiMaterialList: aiOutput.materialList,
            aiLaborBreakdown: aiOutput.laborBreakdown,
            aiPermitRequired: aiOutput.permitRequired,
            aiDraftEmail: aiOutput.draftEmail,
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
