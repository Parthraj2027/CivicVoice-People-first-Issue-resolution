
const express = require('express');
const {
  createIssue,
  getIssuesForAdmin,
  getIssuesForDepartment,
  getIssuesForCitizen,
  updateIssueStatus,
  addDepartmentUpdate,
  reopenIssue,
  deleteIssue,
  rateIssue,
  getStats,
  getRecentIssues,
  getDashboardStats,
  getIssueById,
} = require('../controllers/issueController');
const { protect, adminOnly, departmentOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/stats', getStats);
router.get('/recent', getRecentIssues);
router.get('/dashboard-stats', getDashboardStats);

router.post('/', protect, createIssue);

router.get('/admin', protect, adminOnly, getIssuesForAdmin);
router.patch('/:id', protect, adminOnly, updateIssueStatus);
router.delete('/:id', protect, adminOnly, deleteIssue);

router.get('/department', protect, departmentOnly, getIssuesForDepartment);
router.patch('/:id/department-update', protect, departmentOnly, addDepartmentUpdate);

router.get('/mine', protect, getIssuesForCitizen);
router.patch('/:id/reopen', protect, reopenIssue);
router.patch('/:id/rate', protect, rateIssue);

// Keep dynamic route last so it does not shadow static paths like /admin, /department, /mine
router.get('/:id', getIssueById);

module.exports = router;
