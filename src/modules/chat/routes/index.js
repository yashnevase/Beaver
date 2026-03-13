const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../../../middleware/auth');
const { validateBody } = require('../../../middleware/validate');
const chatController = require('../controllers');
const { sendMessageSchema } = require('../validators/chatValidators');
const { uploadWithCompression } = require('../../../utils/fileUpload');

const prepareChatImageUpload = (req, res, next) => {
  req.uploadSubDir = 'images';
  req.allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  next();
};

router.get('/:agreementId', authenticateToken, requirePermission('chat.view'), chatController.listMessages);
router.post('/:agreementId', authenticateToken, requirePermission('chat.send'), validateBody(sendMessageSchema), chatController.sendMessage);
router.post('/:agreementId/image', authenticateToken, requirePermission('chat.send'), prepareChatImageUpload, uploadWithCompression('image', { generateThumb: false }), chatController.sendImageMessage);

module.exports = router;
