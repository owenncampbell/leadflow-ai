const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
    notes: {
        type: [{
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }],
        default: []
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', leadSchema);
