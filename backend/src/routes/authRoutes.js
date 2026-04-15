
const express = require('express');
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authRateLimit } = require('../middleware/authRateLimit');

const router = express.Router();

router.post('/register', authRateLimit, registerUser);
router.post('/login', authRateLimit, loginUser);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.post('/change-password', authRateLimit, protect, changePassword);

module.exports = router;
