const NGO = require('../models/NGO');
const Issue = require('../models/Issue');
const Alert = require('../models/Alert');
const Department = require('../models/Department');
const { deriveDepartmentForSocialCategory } = require('../utils/issueCatalog');

function canManageNgo(req, ngo) {
  if (!req.user) {
    return false;
  }
  if (req.user.role === 'admin') {
    return true;
  }
  return req.user.role === 'ngo' && ngo.managedBy && ngo.managedBy.toString() === req.user._id.toString();
}

async function createNgo(req, res) {
  try {
    const payload = req.body || {};
    const ngo = await NGO.create({
      name: payload.name,
      description: payload.description || '',
      logoUrl: payload.logoUrl || '',
      registrationNumber: payload.registrationNumber || '',
      specializations: Array.isArray(payload.specializations) ? payload.specializations : [],
      serviceAreas: Array.isArray(payload.serviceAreas) ? payload.serviceAreas : [],
      contact: payload.contact || {},
      isVerified: Boolean(payload.isVerified),
      responseTimeAvg: Number(payload.responseTimeAvg || 0),
      casesHandled: Number(payload.casesHandled || 0),
      resolutionRate: Number(payload.resolutionRate || 0),
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
      managedBy: payload.managedBy || null,
    });

    return res.status(201).json(ngo);
  } catch (error) {
    console.error('createNgo error:', error);
    return res.status(500).json({ message: 'Failed to create NGO' });
  }
}

async function listNgos(req, res) {
  const { specialization, city, verified, q } = req.query;
  const query = { isActive: true };

  if (verified === 'true') {
    query.isVerified = true;
  }
  if (verified === 'false') {
    query.isVerified = false;
  }
  if (specialization) {
    query.specializations = specialization;
  }

  if (q && String(q).trim()) {
    const keyword = String(q).trim();
    query.$or = [
      { name: new RegExp(keyword, 'i') },
      { description: new RegExp(keyword, 'i') },
      { specializations: new RegExp(keyword, 'i') },
      { 'serviceAreas.city': new RegExp(keyword, 'i') },
      { 'serviceAreas.state': new RegExp(keyword, 'i') },
    ];
  }

  const ngos = await NGO.find(query).populate('managedBy', 'name email').sort({ responseTimeAvg: 1, casesHandled: -1 });

  if (!city) {
    return res.json(ngos);
  }

  const filtered = ngos.filter((ngo) =>
    (ngo.serviceAreas || []).some((area) => String(area.city || '').toLowerCase().includes(String(city).toLowerCase()))
  );

  return res.json(filtered);
}

async function getNgoById(req, res) {
  const ngo = await NGO.findById(req.params.id).populate('managedBy', 'name email');
  if (!ngo) {
    return res.status(404).json({ message: 'NGO not found' });
  }
  return res.json(ngo);
}

async function updateNgo(req, res) {
  try {
    const ngo = await NGO.findById(req.params.id);
    if (!ngo) {
      return res.status(404).json({ message: 'NGO not found' });
    }

    if (!canManageNgo(req, ngo)) {
      return res.status(403).json({ message: 'Not authorized to update this NGO' });
    }

    const fields = ['name', 'description', 'logoUrl', 'registrationNumber', 'isVerified', 'responseTimeAvg', 'casesHandled', 'resolutionRate', 'isActive', 'managedBy'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        ngo[field] = req.body[field];
      }
    });

    if (Array.isArray(req.body.specializations)) {
      ngo.specializations = req.body.specializations;
    }
    if (Array.isArray(req.body.serviceAreas)) {
      ngo.serviceAreas = req.body.serviceAreas;
    }
    if (req.body.contact) {
      ngo.contact = { ...ngo.contact.toObject?.() || ngo.contact, ...req.body.contact };
    }

    await ngo.save();
    return res.json(ngo);
  } catch (error) {
    console.error('updateNgo error:', error);
    return res.status(500).json({ message: 'Failed to update NGO' });
  }
}

async function getNgoIssues(req, res) {
  const ngo = await NGO.findById(req.params.id);
  if (!ngo) {
    return res.status(404).json({ message: 'NGO not found' });
  }

  if (!canManageNgo(req, ngo)) {
    return res.status(403).json({ message: 'Not authorized to view these issues' });
  }

  const issues = await Issue.find({ assignedNGO: ngo._id })
    .sort({ createdAt: -1 })
    .populate('assignedDepartment', 'name description')
    .populate('createdBy', 'name email')
    .populate('reportedBy', 'name email');

  return res.json(issues);
}

async function acceptCase(req, res) {
  const ngo = await NGO.findById(req.params.id);
  if (!ngo) {
    return res.status(404).json({ message: 'NGO not found' });
  }
  if (!canManageNgo(req, ngo)) {
    return res.status(403).json({ message: 'Not authorized to manage this NGO' });
  }

  const issue = await Issue.findById(req.params.issueId);
  if (!issue || issue.issueTrack !== 'social') {
    return res.status(404).json({ message: 'Social issue not found' });
  }

  issue.assignedNGO = ngo._id;
  issue.status = 'assigned';
  issue.escalationHistory.push({
    timestamp: new Date(),
    fromEntity: 'public',
    toEntity: ngo.name,
    reason: 'NGO accepted case',
  });

  ngo.casesHandled = (ngo.casesHandled || 0) + 1;
  await issue.save();
  await ngo.save();

  return res.json(issue);
}

async function resolveCase(req, res) {
  const ngo = await NGO.findById(req.params.id);
  if (!ngo) {
    return res.status(404).json({ message: 'NGO not found' });
  }
  if (!canManageNgo(req, ngo)) {
    return res.status(403).json({ message: 'Not authorized to manage this NGO' });
  }

  const issue = await Issue.findById(req.params.issueId);
  if (!issue || issue.issueTrack !== 'social') {
    return res.status(404).json({ message: 'Social issue not found' });
  }

  issue.status = 'resolved';
  issue.resolvedAt = new Date();
  if (Array.isArray(req.body.resolutionProofUrls) && req.body.resolutionProofUrls.length > 0) {
    issue.resolutionProofUrls = Array.from(new Set([...(issue.resolutionProofUrls || []), ...req.body.resolutionProofUrls]));
  }
  issue.escalationHistory.push({
    timestamp: new Date(),
    fromEntity: ngo.name,
    toEntity: 'resolved',
    reason: req.body.reason || 'NGO marked resolved',
  });

  ngo.resolutionRate = Math.min(100, Number(ngo.resolutionRate || 0) + 1);
  await issue.save();
  await ngo.save();

  await Alert.create({
    title: `Social issue resolved by ${ngo.name}`,
    message: `Issue ${issue.publicId} has been resolved.`,
    type: 'success',
    createdBy: req.user?._id || null,
  }).catch(() => null);

  return res.json(issue);
}

async function escalateToGov(req, res) {
  const ngo = await NGO.findById(req.params.id);
  if (!ngo) {
    return res.status(404).json({ message: 'NGO not found' });
  }
  if (!canManageNgo(req, ngo)) {
    return res.status(403).json({ message: 'Not authorized to manage this NGO' });
  }

  const issue = await Issue.findById(req.params.issueId);
  if (!issue || issue.issueTrack !== 'social') {
    return res.status(404).json({ message: 'Social issue not found' });
  }

  const departmentName = deriveDepartmentForSocialCategory(issue.socialCategory);
  const department = await Department.findOne({ name: new RegExp(departmentName, 'i') });

  issue.assignedDepartment = department ? department._id : null;
  issue.status = 'escalated';
  issue.escalationHistory.push({
    timestamp: new Date(),
    fromEntity: ngo.name,
    toEntity: department ? department.name : departmentName,
    reason: req.body.reason || 'Escalated by NGO',
  });

  await issue.save();

  await Alert.create({
    title: `Social issue escalated: ${issue.publicId}`,
    message: `Issue escalated from ${ngo.name} to government department.`,
    type: 'critical',
    createdBy: req.user?._id || null,
  }).catch(() => null);

  return res.json(issue);
}

async function getNgoAnalytics(req, res) {
  const ngo = await NGO.findById(req.params.id);
  if (!ngo) {
    return res.status(404).json({ message: 'NGO not found' });
  }
  if (!canManageNgo(req, ngo)) {
    return res.status(403).json({ message: 'Not authorized to view analytics' });
  }

  const [assigned, resolved, escalated] = await Promise.all([
    Issue.countDocuments({ assignedNGO: ngo._id }),
    Issue.countDocuments({ assignedNGO: ngo._id, status: 'resolved' }),
    Issue.countDocuments({ assignedNGO: ngo._id, status: 'escalated' }),
  ]);

  return res.json({
    ngoId: ngo._id,
    casesHandled: ngo.casesHandled,
    resolutionRate: ngo.resolutionRate,
    responseTimeAvg: ngo.responseTimeAvg,
    assigned,
    resolved,
    escalated,
  });
}

module.exports = {
  createNgo,
  listNgos,
  getNgoById,
  updateNgo,
  getNgoIssues,
  acceptCase,
  resolveCase,
  escalateToGov,
  getNgoAnalytics,
};
