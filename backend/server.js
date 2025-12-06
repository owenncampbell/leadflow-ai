const express = require('express');
const path = require('path');
const OpenAI = require('openai'); // Import OpenAI library
require('dotenv').config({ path: path.resolve(__dirname, './.env') }); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Use OPENAI_API_KEY
});

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API endpoint for lead analysis
app.post('/api/analyze-lead', async (req, res) => {
    const { projectDescription, clientName, clientEmail } = req.body;

    if (!projectDescription || !clientName || !clientEmail) {
        return res.status(400).json({ error: 'Missing required lead information.' });
    }

    // Construct the prompt for the AI
    const prompt = `You are an AI assistant for a contracting business. Your task is to analyze a project description, categorize it, summarize it, provide a rough cost estimate, and draft a professional email response to the client.

Project Description: "${projectDescription}"
Client Name: "${clientName}"

Please provide your response in a JSON format with the following keys:
- "summary": A concise summary of the project.
- "category": A category for the project (e.g., "Kitchen Remodel", "Deck Construction", "Landscaping", "Plumbing Repair").
- "costEstimate": A rough, non-binding, ballpark cost estimate for the project. This should be a string (e.g., "$5,000 - $8,000"). Preface it with "Ballpark Estimate:".
- "draftEmail": A polite and professional email to the client. The email should:
    - Thank them for their inquiry.
    - Confirm their project description.
    - Ask 1-2 clarifying questions to get more details or suggest a brief call.
    - Be signed off as "LeadFlow AI Team".`;

    try {
        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Using a suitable OpenAI model
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }, // Request JSON object
        });

        const text = chatCompletion.choices[0].message.content;

        // Attempt to parse the JSON output from the AI
        let aiOutput;
        try {
            aiOutput = JSON.parse(text);
        } catch (jsonError) {
            console.error('Failed to parse AI response as JSON:', text, jsonError);
            return res.status(500).json({ error: 'AI response was not in expected JSON format.' });
        }

        const { summary: aiSummary, category: aiCategory, costEstimate: aiCostEstimate, draftEmail: aiDraftEmail } = aiOutput;

        res.json({
            id: Date.now(),
            projectDescription,
            clientName,
            clientEmail,
            aiSummary,
            aiCategory,
            aiCostEstimate,
            aiDraftEmail,
        });

    } catch (error) {
        console.error('Error integrating AI:', error);
        res.status(500).json({ error: 'Failed to process lead with AI. Please check server logs.' });
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