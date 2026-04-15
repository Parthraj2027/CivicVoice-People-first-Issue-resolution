
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
const LOGIN_LOCK_THRESHOLD = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

const isStrongPassword = (password) => strongPasswordRegex.test(String(password || ''));

const getPasswordRuleMessage = () =>
  'Password must be 8-64 characters and include uppercase, lowercase, number, and special character.';

const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide all fields' });
  }

  if (String(name).trim().length < 2) {
    return res.status(400).json({ message: 'Name must be at least 2 characters' });
  }

  if (!emailRegex.test(String(email).trim())) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: getPasswordRuleMessage() });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: 'citizen',
  });

  generateToken(res, user._id);

  const data = user.toObject();
  delete data.password;
  res.status(201).json(data);
};

const loginUser = async (req, res) => {
  const { email, password, expectedRole } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  if (!emailRegex.test(String(email).trim())) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).populate('department', 'name');
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
    const remainingMinutes = Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / 60000);
    return res.status(423).json({
      message: `Account temporarily locked due to failed attempts. Try again in ${remainingMinutes} minute(s).`,
    });
  }

  const match = await user.matchPassword(password);
  if (!match) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= LOGIN_LOCK_THRESHOLD) {
      user.lockUntil = new Date(Date.now() + LOGIN_LOCK_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (expectedRole && user.role !== expectedRole) {
    return res.status(403).json({
      message: `This account is a ${user.role} account, not ${expectedRole}.`,
    });
  }

  if (user.failedLoginAttempts || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();
  }

  generateToken(res, user._id);

  const data = user.toObject();
  delete data.password;
  res.json(data);
};

const logoutUser = async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ message: 'Logged out' });
};

const getMe = async (req, res) => {
  res.json(req.user);
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: 'Current password and new password are required' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const match = await user.matchPassword(currentPassword);
  if (!match) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ message: getPasswordRuleMessage() });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ message: 'New password must be different from current password' });
  }

  user.password = newPassword;
  await user.save();

  generateToken(res, user._id);

  res.json({ message: 'Password updated successfully' });
};

module.exports = { registerUser, loginUser, logoutUser, getMe, changePassword };
