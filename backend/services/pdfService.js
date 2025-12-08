const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const generateProposalPdf = async (lead) => {
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
    return Buffer.from(pdfBytes);
};

module.exports = {
    generateProposalPdf,
};
