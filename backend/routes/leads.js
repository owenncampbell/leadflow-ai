const express = require('express');
const router = express.Router();
const {
    getLeads,
    analyzeLead,
    updateLeadStatus,
    deleteLead,
    updateLeadEmail,
    generateProposal,
} = require('../controllers/leadController');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const analyzeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many requests to the analyze endpoint from this IP, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
});

router.get('/', auth, getLeads);
router.post('/analyze', auth, analyzeLimiter, analyzeLead);
router.put('/:id/status', auth, updateLeadStatus);
router.delete('/:id', auth, deleteLead);
router.put('/:id/email', auth, updateLeadEmail);
router.get('/:id/proposal', auth, generateProposal);

module.exports = router;
