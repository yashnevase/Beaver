const PDFDocument = require('pdfkit');
const db = require('../../../models');
const datetimeService = require('../../../lib/datetime');
const { ApiError } = require('../../../middleware/errorHandler');
const logger = require('../../../config/logger');

const buildUserWhere = (query) => {
  const where = { deleted_at: null };
  if (query.role) where.role = query.role;
  if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
  if (query.email_verified !== undefined) where.email_verified = query.email_verified === 'true';
  if (query.search) {
    where[db.Sequelize.Op.or] = [
      { email: { [db.Sequelize.Op.like]: `%${query.search}%` } },
      { full_name: { [db.Sequelize.Op.like]: `%${query.search}%` } }
    ];
  }
  return where;
};

const exportToExcel = async (query, currentUser) => {
  try {
    const where = buildUserWhere(query);
    const users = await db.User.findAll({
      where,
      attributes: { exclude: ['password_hash', 'password_reset_token'] },
      order: [['created_at', 'DESC']]
    });

    const header = 'User ID\tEmail\tFull Name\tRole\tActive\tEmail Verified\tLast Login\tCreated At\n';
    const rows = users.map(u =>
      `${u.user_id}\t${u.email}\t${u.full_name}\t${u.role}\t${u.is_active ? 'Yes' : 'No'}\t${u.email_verified ? 'Yes' : 'No'}\t${u.last_login_at ? datetimeService.formatDateTime(u.last_login_at) : 'Never'}\t${datetimeService.formatDateTime(u.created_at)}`
    ).join('\n');

    const buffer = Buffer.from(header + rows, 'utf-8');
    const filename = `users_export_${Date.now()}.tsv`;

    logger.info(`Users exported to TSV by user ${currentUser.email}`);
    return { buffer, filename, contentType: 'text/tab-separated-values' };
  } catch (error) {
    logger.error('Error exporting users to Excel:', error);
    throw ApiError.internal('Failed to export users');
  }
};

const exportToPDF = async (query, currentUser) => {
  try {
    const where = buildUserWhere(query);
    const users = await db.User.findAll({
      where,
      attributes: { exclude: ['password_hash', 'password_reset_token'] },
      order: [['created_at', 'DESC']]
    });

    const chunks = [];
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.on('data', chunk => chunks.push(chunk));

    const bufferPromise = new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    doc.fontSize(18).text('Users Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated: ${datetimeService.getCurrentDateTime()}  |  By: ${currentUser.email}  |  Total: ${users.length}`);
    doc.moveDown();

    const headers = ['ID', 'Email', 'Name', 'Role', 'Active', 'Verified'];
    const colWidths = [35, 170, 120, 60, 45, 55];
    let y = doc.y;

    doc.fontSize(8).font('Helvetica-Bold');
    let x = 40;
    headers.forEach((h, i) => { doc.text(h, x, y, { width: colWidths[i] }); x += colWidths[i]; });
    y += 14;
    doc.moveTo(40, y).lineTo(530, y).stroke();
    y += 4;

    doc.font('Helvetica');
    for (const u of users) {
      if (y > 750) { doc.addPage(); y = 40; }
      x = 40;
      const row = [String(u.user_id), u.email, u.full_name, u.role, u.is_active ? 'Y' : 'N', u.email_verified ? 'Y' : 'N'];
      row.forEach((cell, i) => { doc.text(cell, x, y, { width: colWidths[i], ellipsis: true }); x += colWidths[i]; });
      y += 12;
    }

    doc.end();
    const buffer = await bufferPromise;
    const filename = `users_report_${Date.now()}.pdf`;

    logger.info(`Users exported to PDF by user ${currentUser.email}`);
    return { buffer, filename };
  } catch (error) {
    logger.error('Error exporting users to PDF:', error);
    throw ApiError.internal('Failed to export users to PDF');
  }
};

module.exports = {
  exportToExcel,
  exportToPDF
};
