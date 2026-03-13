const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const ensurePdfDir = () => {
  const baseDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
  const pdfDir = path.join(baseDir, 'transactions');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  return pdfDir;
};

const generateTransactionsPdf = async (transactions, user) => {
  const pdfDir = ensurePdfDir();
  const fileName = `transactions_${user.user_id}_${Date.now()}.pdf`;
  const filePath = path.join(pdfDir, fileName);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20).text('Beaver Transactions Export', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`User ID: ${user.user_id}`);
    doc.text(`Role: ${user.role}`);
    doc.text(`Generated At: ${new Date().toISOString()}`);
    doc.moveDown();

    if (!transactions.length) {
      doc.text('No transactions found for the selected criteria.');
    } else {
      transactions.forEach((transaction, index) => {
        doc.fontSize(13).text(`Transaction #${index + 1}`, { underline: true });
        doc.fontSize(11).text(`ID: ${transaction.transaction_id}`);
        doc.text(`Agreement ID: ${transaction.agreement_id}`);
        doc.text(`Type: ${transaction.type}`);
        doc.text(`Amount: INR ${transaction.amount}`);
        doc.text(`GST: INR ${transaction.gst_amount || 0}`);
        doc.text(`Status: ${transaction.status}`);
        doc.text(`Due Date: ${transaction.due_date || 'N/A'}`);
        doc.text(`Paid At: ${transaction.paid_at || 'N/A'}`);
        doc.text(`Description: ${transaction.description || 'N/A'}`);
        doc.moveDown();
      });
    }

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return {
    filePath,
    fileName,
    relativePath: path.join('transactions', fileName).replace(/\\/g, '/')
  };
};

module.exports = {
  generateTransactionsPdf
};
