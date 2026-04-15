const express = require('express');
const {
  createNgo,
  listNgos,
  getNgoById,
  updateNgo,
  getNgoIssues,
  acceptCase,
  resolveCase,
  escalateToGov,
  getNgoAnalytics,
} = require('../controllers/ngoController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, adminOnly, createNgo);
router.get('/', listNgos);
router.get('/:id', getNgoById);
router.put('/:id', protect, updateNgo);
router.get('/:id/issues', protect, getNgoIssues);
router.put('/:id/accept/:issueId', protect, acceptCase);
router.put('/:id/resolve/:issueId', protect, resolveCase);
router.post('/:id/escalate/:issueId', protect, escalateToGov);
router.get('/:id/analytics', protect, getNgoAnalytics);

module.exports = router;
