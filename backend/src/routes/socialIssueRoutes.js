const express = require('express');
const {
  createSocialIssue,
  listSocialIssues,
  getSocialIssueById,
  updateSocialIssue,
  upvoteSocialIssue,
  addWitnessStatement,
} = require('../controllers/socialIssueController');
const { protect, adminOnly, departmentOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createSocialIssue);
router.get('/', listSocialIssues);
router.get('/:id', getSocialIssueById);
router.put('/:id', protect, (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.role === 'ngo' || req.user?.role === 'department') {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized to update social issues' });
}, updateSocialIssue);
router.put('/:id/upvote', protect, upvoteSocialIssue);
router.post('/:id/witness', protect, addWitnessStatement);

module.exports = router;
