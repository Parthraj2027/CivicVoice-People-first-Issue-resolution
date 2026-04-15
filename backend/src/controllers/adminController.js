
const User = require('../models/User');
const Department = require('../models/Department');
const Issue = require('../models/Issue');
const OpenAI = require('openai');
const { analyzeIssueText } = require('../services/issueIntelligence');
const { findBestNgoForIssue } = require('./socialIssueController');
const {
  deriveDepartmentForCivicCategory,
  deriveDepartmentForSocialCategory,
  formatIssueLocation,
} = require('../utils/issueCatalog');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const createAdminUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({ name, email, password, role: 'admin' });
  const obj = user.toObject();
  delete obj.password;

  res.status(201).json(obj);
};

const createDepartment = async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const existing = await Department.findOne({ name });
  if (existing) {
    return res.status(400).json({ message: 'Department already exists' });
  }

  const dept = await Department.create({ name, description });
  res.status(201).json(dept);
};

const listDepartments = async (req, res) => {
  const depts = await Department.find().sort({ name: 1 });
  res.json(depts);
};

const createDepartmentUser = async (req, res) => {
  const { name, email, password, departmentName } = req.body;

  if (!name || !email || !password || !departmentName) {
    return res
      .status(400)
      .json({ message: 'Name, email, password and departmentName are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  // Find or create the department
  let dept = await Department.findOne({ name: departmentName });
  if (!dept) {
    dept = await Department.create({ name: departmentName });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'department',
    department: dept._id,
  });

  const populated = await User.findById(user._id)
    .select('-password')
    .populate('department', 'name');

  return res.status(201).json(populated);
};

const listDepartmentUsers = async (req, res) => {
  const users = await User.find({ role: 'department' })
    .select('-password')
    .populate('department', 'name');
  res.json(users);
};

const updateDepartmentUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, departmentId } = req.body;

  const user = await User.findOne({ _id: id, role: 'department' });
  if (!user) {
    return res.status(404).json({ message: 'Department user not found' });
  }

  if (email && email !== user.email) {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Another user with this email exists' });
    }
    user.email = email;
  }

  if (name) {
    user.name = name;
  }

  if (departmentId) {
    const dept = await Department.findById(departmentId);
    if (!dept) {
      return res.status(400).json({ message: 'Department not found' });
    }
    user.department = dept._id;
  }

  await user.save();

  const populated = await User.findById(user._id)
    .select('-password')
    .populate('department', 'name');

  return res.json(populated);
};

const deleteDepartmentUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findOne({ _id: id, role: 'department' });
  if (!user) {
    return res.status(404).json({ message: 'Department user not found' });
  }

  await user.deleteOne();
  return res.json({ id, message: 'Department user deleted' });
};

const processGeneralInput = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Text input is required' });
    }

    const analysis = await analyzeIssueText({ text, track: 'mixed' });
    const structuredData = {
      issueTrack: analysis.issueTrack,
      issueType: analysis.issueTrack === 'social' ? analysis.socialCategory || 'social' : analysis.civicCategory || 'civic',
      civicCategory: analysis.civicCategory || '',
      socialCategory: analysis.socialCategory || '',
      title: analysis.title || text.slice(0, 80),
      location: analysis.location?.address || 'Location not specified',
      landmark: '',
      severity: ['low', 'medium', 'high', 'critical', 'emergency'].includes(analysis.severity)
        ? analysis.severity
        : 'medium',
      urgencyLevel: analysis.urgencyLevel || 'low',
      description: analysis.description || text,
      summary: analysis.summary || text.substring(0, 100),
      impact: '',
      recurrence: 'new',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      preferredContactMethod: 'none',
      helplinesTriggered: analysis.helplinesTriggered || [],
      locationDetails: analysis.location || {},
    };

    // Return the structured data without creating the issue yet
    res.status(200).json({
      message: 'Text processed successfully',
      structuredData,
      originalText: text,
    });
  } catch (error) {
    console.error('Error processing general input:', error);
    res.status(500).json({
      message: 'Failed to process input',
      error: error.message,
    });
  }
};

const createComplaintFromStructuredData = async (req, res) => {
  try {
    const structuredData = req.body;

    // Validate required fields
    if (!structuredData.issueType || !structuredData.location || !structuredData.severity || !structuredData.description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const issueTrack = structuredData.issueTrack === 'social' || structuredData.socialCategory ? 'social' : 'civic';
    const location = structuredData.locationDetails || structuredData.location || 'Location not specified';
    let assignedNGO = null;
    let assignedDepartment = null;

    if (issueTrack === 'social') {
      assignedNGO = await findBestNgoForIssue({
        socialCategory: structuredData.socialCategory || 'environment',
        location,
      });
      const departmentName = deriveDepartmentForSocialCategory(structuredData.socialCategory || 'environment');
      assignedDepartment = await Department.findOne({ name: new RegExp(departmentName, 'i') });
    } else {
      const departmentName = deriveDepartmentForCivicCategory(structuredData.civicCategory || structuredData.issueType || 'other');
      assignedDepartment = await Department.findOne({ name: new RegExp(departmentName, 'i') });
    }

    const issueData = {
      title: structuredData.title || structuredData.summary || structuredData.issueType,
      issueType: structuredData.issueType,
      issueTrack,
      civicCategory: issueTrack === 'civic' ? (structuredData.civicCategory || structuredData.issueType || 'other') : null,
      socialCategory: issueTrack === 'social' ? (structuredData.socialCategory || null) : null,
      location,
      urgencyLevel: structuredData.urgencyLevel || structuredData.severity || 'low',
      landmark: structuredData.landmark || '',
      severity: structuredData.severity,
      description: structuredData.description,
      summary: structuredData.summary || structuredData.description.substring(0, 100),
      impact: structuredData.impact || '',
      recurrence: structuredData.recurrence || 'new',
      contactName: structuredData.contactName || '',
      contactPhone: structuredData.contactPhone || '',
      contactEmail: structuredData.contactEmail || '',
      preferredContactMethod: structuredData.preferredContactMethod || 'none',
      status: issueTrack === 'social' ? (assignedNGO ? 'assigned' : 'submitted') : 'pending',
      createdBy: req.user?.userId || null,
      reportedBy: req.user?.userId || null,
      assignedNGO: assignedNGO?._id || null,
      assignedDepartment: assignedDepartment?._id || null,
      helplineTriggered: structuredData.helplinesTriggered || [],
    };

    const issue = await Issue.create(issueData);
    const populatedIssue = await Issue.findById(issue._id)
      .populate('createdBy', 'name email')
      .populate('forwardedTo', 'name');

    res.status(201).json({
      message: 'Complaint created successfully',
      issue: populatedIssue,
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({
      message: 'Failed to create complaint',
      error: error.message,
    });
  }
};

module.exports = {
  createAdminUser,
  createDepartment,
  listDepartments,
  createDepartmentUser,
  listDepartmentUsers,
  updateDepartmentUser,
  deleteDepartmentUser,
  processGeneralInput,
  createComplaintFromStructuredData,
};
