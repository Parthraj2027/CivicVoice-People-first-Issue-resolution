
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').populate('department', 'name');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('JWT error', err.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
};

const departmentOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'department') {
    return res.status(403).json({ message: 'Department access only' });
  }
  next();
};

const ngoOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'ngo') {
    return res.status(403).json({ message: 'NGO access only' });
  }
  next();
};

const volunteerOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'volunteer') {
    return res.status(403).json({ message: 'Volunteer access only' });
  }
  next();
};

module.exports = { protect, adminOnly, departmentOnly, ngoOnly, volunteerOnly };
