const OpenAI = require('openai');

const sanitizeForAI = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[`${}]/g, '');
};

const analyzeProject = async (projectDescription, clientName) => {
    const sanitizedProjectDescription = sanitizeForAI(projectDescription);
    const sanitizedClientName = sanitizeForAI(clientName);

    if (!sanitizedProjectDescription || !sanitizedClientName) {
        const error = new Error('Missing required project description or client name.');
        error.statusCode = 400;
        throw error;
    }

    const prompt = `You are an AI assistant for a contracting business. Analyze the project description below.

Project Description: "${sanitizedProjectDescription}"

Provide your response in a valid JSON format with the following keys:
- "summary": A concise summary of the project.
- "category": A category for the project (e.g., "Kitchen Remodel", "Deck Construction", "Fencing").
- "costEstimate": A rough, non-binding, ballpark cost estimate as a string (e.g., "$5,000 - $8,000").
- "materialList": An array of strings, listing potential materials. This MUST be an array of strings.
- "laborBreakdown": An array of strings, listing the major labor tasks. This MUST be an array of strings.
- "permitRequired": A string: "Yes", "No", or "Possibly".
- "draftEmail": A polite, professional email to the client named "${sanitizedClientName}", confirming the project details and asking clarifying questions. Sign off as "LeadFlow AI Team".`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const chatCompletion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
    });

    try {
        return JSON.parse(chatCompletion.choices[0].message.content);
    } catch (error) {
        const newError = new Error('Failed to parse AI response.');
        newError.statusCode = 500;
        throw newError;
    }
};

module.exports = {
    analyzeProject,
};
