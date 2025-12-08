const { generateProposalPdf } = require('../services/pdfService');
const { PDFDocument } = require('pdf-lib');

describe('PDF Service', () => {
    it('should generate a PDF document', async () => {
        const lead = {
            clientName: 'Test Client',
            aiSummary: 'Test Summary',
            aiLaborBreakdown: ['Test Labor'],
            aiMaterialList: ['Test Material'],
            aiCostEstimate: '$100',
        };

        const pdfBytes = await generateProposalPdf(lead);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        expect(pdfDoc.getPageCount()).toBe(1);
    });
});
