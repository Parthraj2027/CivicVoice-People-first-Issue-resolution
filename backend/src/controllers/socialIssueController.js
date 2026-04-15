const Issue = require('../models/Issue');
const NGO = require('../models/NGO');
const Department = require('../models/Department');
const Alert = require('../models/Alert');
const { analyzeIssueText } = require('../services/issueIntelligence');
const {
  deriveDepartmentForSocialCategory,
  deriveHelplines,
  formatIssueLocation,
} = require('../utils/issueCatalog');

const SOCIAL_STATUSES = ['submitted', 'reviewing', 'assigned', 'in_progress', 'resolved', 'escalated', 'closed'];

function normalizeLocation(location = {}) {
  if (typeof location === 'string') {
    return { address: location };
  }

  return {
    address: location.address || '',
    city: location.city || '',
    state: location.state || '',
    pincode: location.pincode || '',
    lat: Number(location.lat || location.latitude || 0) || undefined,
    lng: Number(location.lng || location.longitude || 0) || undefined,
  };
}

async function findBestNgoForIssue({ socialCategory, location }) {
  const candidates = await NGO.find({
    isActive: true,
    isVerified: true,
    specializations: socialCategory,
  }).populate('managedBy', 'name email');

  if (candidates.length === 0) {
    return null;
  }

  const normalized = normalizeLocation(location);
  const city = String(normalized.city || '').toLowerCase();
  const state = String(normalized.state || '').toLowerCase();
  const pincode = String(normalized.pincode || '').toLowerCase();

  const scored = candidates.map((ngo) => {
    const serviceMatch = (ngo.serviceAreas || []).some((area) => {
      const areaCity = String(area.city || '').toLowerCase();
      const areaState = String(area.state || '').toLowerCase();
      const areaPincode = String(area.pincode || '').toLowerCase();
      return (
        (city && areaCity && areaCity === city) ||
        (state && areaState && areaState === state) ||
        (pincode && areaPincode && areaPincode === pincode)
      );
    });

    return {
      ngo,
      score: (serviceMatch ? 100 : 0) + (100 - Number(ngo.responseTimeAvg || 0)),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.ngo || null;
}

async function findPreferredNgoForIssue({ ngoId, socialCategory, location }) {
  if (!ngoId) {
    return null;
  }

  const ngo = await NGO.findOne({ _id: ngoId, isActive: true, isVerified: true }).populate('managedBy', 'name email');
  if (!ngo) {
    return null;
  }

  const supportsCategory = (ngo.specializations || []).includes(socialCategory);
  const normalized = normalizeLocation(location);
  const city = String(normalized.city || '').toLowerCase();
  const state = String(normalized.state || '').toLowerCase();
  const pincode = String(normalized.pincode || '').toLowerCase();

  const servesArea = (ngo.serviceAreas || []).some((area) => {
    const areaCity = String(area.city || '').toLowerCase();
    const areaState = String(area.state || '').toLowerCase();
    const areaPincode = String(area.pincode || '').toLowerCase();
    return (
      (city && areaCity && areaCity === city) ||
      (state && areaState && areaState === state) ||
      (pincode && areaPincode && areaPincode === pincode)
    );
  });

  // Accept preferred NGO if specialization matches. Area match is preferred but optional.
  if (supportsCategory || servesArea) {
    return ngo;
  }

  return null;
}

async function createSocialIssue(req, res) {
  try {
    const payload = req.body || {};
    const text = [payload.title, payload.description].filter(Boolean).join(' ').trim();

    if (!text) {
      return res.status(400).json({ message: 'Title or description is required' });
    }

    let analysis = {};
    try {
      analysis = await analyzeIssueText({
        text,
        track: 'social',
        categoryHint: payload.socialCategory,
        locationHint: formatIssueLocation(payload.location),
      });
    } catch (aiError) {
      console.warn('AI analysis unavailable, proceeding with manual data:', aiError.message);
      analysis = {};
    }

    const socialCategory = payload.socialCategory || analysis.socialCategory || 'environment';
    const urgencyLevel = payload.urgencyLevel || analysis.urgencyLevel || 'low';
    const severity = payload.severity || analysis.severity || urgencyLevel;
    const location = normalizeLocation(payload.location || analysis.location || {});
    const geoLocation =
      typeof location.lat === 'number' && typeof location.lng === 'number'
        ? {
            latitude: Number(location.lat),
            longitude: Number(location.lng),
            source: payload.location?.source || 'map_click',
          }
        : null;
    const helplinesTriggered = Array.from(
      new Set([
        ...(Array.isArray(payload.helplinesTriggered) ? payload.helplinesTriggered : []),
        ...(analysis.helplinesTriggered || []),
        ...(urgencyLevel === 'emergency' ? deriveHelplines({ socialCategory, urgencyLevel, description: text }) : []),
      ])
    );

    const preferredNgo = await findPreferredNgoForIssue({
      ngoId: payload.preferredNgoId,
      socialCategory,
      location,
    });
    const matchedNgo = preferredNgo || (await findBestNgoForIssue({ socialCategory, location }));
    const assignedDepartmentName = deriveDepartmentForSocialCategory(socialCategory);
    const assignedDepartment = await Department.findOne({ name: new RegExp(assignedDepartmentName, 'i') });

    const isEmergency = urgencyLevel === 'emergency' || severity === 'emergency';
    const issue = await Issue.create({
      title: payload.title || analysis.title || 'Social issue report',
      issueType: 'social',
      issueTrack: 'social',
      socialCategory,
      civicCategory: null,
      location,
      geoLocation,
      severity,
      urgencyLevel,
      description: payload.description || analysis.description || text,
      summary: payload.summary || analysis.summary || text.slice(0, 140),
      evidenceUrls: Array.isArray(payload.evidenceUrls) ? payload.evidenceUrls : [],
      contactName: payload.contactName || '',
      contactPhone: payload.contactPhone || '',
      contactEmail: payload.contactEmail || '',
      preferredContactMethod: payload.preferredContactMethod || 'none',
      status: matchedNgo ? 'assigned' : 'submitted',
      reportedBy: payload.isAnonymous ? null : (req.user?._id || null),
      createdBy: payload.isAnonymous ? null : (req.user?._id || null),
      isAnonymous: Boolean(payload.isAnonymous),
      assignedNGO: matchedNgo ? matchedNgo._id : null,
      assignedDepartment: !matchedNgo && assignedDepartment ? assignedDepartment._id : null,
      communityUpvotes: 0,
      upvotedBy: [],
      witnesses: [],
      escalationHistory: [],
      helplineTriggered: helplinesTriggered,
      resolutionProofUrls: [],
      resolvedAt: null,
    });

    if (isEmergency) {
      await Alert.create({
        title: `Emergency social issue: ${issue.title}`,
        message: `Emergency issue ${issue.publicId} requires immediate attention.`,
        type: 'critical',
        createdBy: req.user?._id || null,
      }).catch(() => null);
    }

    const populated = await Issue.findById(issue._id)
      .populate('assignedNGO', 'name logoUrl contact responseTimeAvg resolutionRate managedBy')
      .populate('assignedDepartment', 'name description')
      .populate('createdBy', 'name email')
      .populate('reportedBy', 'name email');

    return res.status(201).json({
      message: 'Social issue submitted successfully',
      issueId: issue.publicId,
      issue: populated,
    });
  } catch (error) {
    console.error('createSocialIssue error:', error);
    return res.status(500).json({ message: 'Failed to submit social issue' });
  }
}

async function listSocialIssues(req, res) {
  const { category, city, status, severity } = req.query;
  const query = { issueTrack: 'social' };

  if (category) query.socialCategory = category;
  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (city) {
    query.$or = [
      { 'location.city': new RegExp(city, 'i') },
      { location: new RegExp(city, 'i') },
    ];
  }

  const issues = await Issue.find(query)
    .sort({ createdAt: -1 })
    .populate('assignedNGO', 'name logoUrl contact responseTimeAvg resolutionRate managedBy')
    .populate('assignedDepartment', 'name description')
    .populate('createdBy', 'name email')
    .populate('reportedBy', 'name email')
    .lean();

  return res.json(issues);
}

async function getSocialIssueById(req, res) {
  const issue = await Issue.findOne({ _id: req.params.id, issueTrack: 'social' })
    .populate('assignedNGO', 'name logoUrl contact responseTimeAvg resolutionRate managedBy')
    .populate('assignedDepartment', 'name description')
    .populate('createdBy', 'name email')
    .populate('reportedBy', 'name email');

  if (!issue) {
    return res.status(404).json({ message: 'Social issue not found' });
  }

  return res.json(issue);
}

async function updateSocialIssue(req, res) {
  try {
    const issue = await Issue.findOne({ _id: req.params.id, issueTrack: 'social' });
    if (!issue) {
      return res.status(404).json({ message: 'Social issue not found' });
    }

    const isAdmin = req.user?.role === 'admin';
    const ngo = req.user?.role === 'ngo' ? await NGO.findOne({ managedBy: req.user._id }) : null;
    const isDepartment = req.user?.role === 'department';

    if (req.user?.role === 'ngo') {
      if (!ngo) {
        return res.status(403).json({ message: 'NGO profile not found for this account' });
      }
      if (issue.assignedNGO && issue.assignedNGO.toString() !== ngo._id.toString()) {
        return res.status(403).json({ message: 'Issue is not assigned to your NGO' });
      }
    }

    if (isDepartment) {
      if (!req.user.department) {
        return res.status(403).json({ message: 'Department assignment required' });
      }
      if (issue.assignedDepartment && issue.assignedDepartment.toString() !== req.user.department._id.toString()) {
        return res.status(403).json({ message: 'Issue is not assigned to your department' });
      }
    }

    if (!isAdmin && !ngo && !isDepartment) {
      return res.status(403).json({ message: 'Not authorized to update this issue' });
    }

    const { status, note, resolutionProofUrls, assignedDepartmentId } = req.body;
    if (status && !SOCIAL_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    if (status) {
      issue.status = status;
      if (status === 'resolved') {
        issue.resolvedAt = new Date();
      }
    }

    if (note) {
      issue.departmentUpdates.push({
        text: note,
        status: status || issue.status,
        addedBy: req.user._id,
        department: req.user.department?._id || issue.assignedDepartment || null,
      });
    }

    if (Array.isArray(resolutionProofUrls) && resolutionProofUrls.length > 0) {
      issue.resolutionProofUrls = Array.from(new Set([...(issue.resolutionProofUrls || []), ...resolutionProofUrls]));
    }

    if (assignedDepartmentId && isAdmin) {
      issue.assignedDepartment = assignedDepartmentId;
    }

    const saved = await issue.save();
    const populated = await Issue.findById(saved._id)
      .populate('assignedNGO', 'name logoUrl contact responseTimeAvg resolutionRate managedBy')
      .populate('assignedDepartment', 'name description')
      .populate('createdBy', 'name email')
      .populate('reportedBy', 'name email');

    return res.json(populated);
  } catch (error) {
    console.error('updateSocialIssue error:', error);
    return res.status(500).json({ message: 'Failed to update social issue' });
  }
}

async function upvoteSocialIssue(req, res) {
  try {
    const issue = await Issue.findOne({ _id: req.params.id, issueTrack: 'social' });
    if (!issue) {
      return res.status(404).json({ message: 'Social issue not found' });
    }

    if (!req.user || req.user.role !== 'citizen') {
      return res.status(403).json({ message: 'Citizen access only' });
    }

    const alreadyUpvoted = (issue.upvotedBy || []).some((id) => id.toString() === req.user._id.toString());
    if (!alreadyUpvoted) {
      issue.communityUpvotes = (issue.communityUpvotes || 0) + 1;
      issue.upvotedBy.push(req.user._id);
    }

    const saved = await issue.save();
    return res.json(saved);
  } catch (error) {
    console.error('upvoteSocialIssue error:', error);
    return res.status(500).json({ message: 'Failed to upvote issue' });
  }
}

async function addWitnessStatement(req, res) {
  try {
    const issue = await Issue.findOne({ _id: req.params.id, issueTrack: 'social' });
    if (!issue) {
      return res.status(404).json({ message: 'Social issue not found' });
    }

    const { statement } = req.body;
    if (!statement || !statement.trim()) {
      return res.status(400).json({ message: 'Witness statement is required' });
    }

    issue.witnesses.push({
      userId: req.user?._id || null,
      statement: statement.trim(),
    });

    const saved = await issue.save();
    return res.json(saved);
  } catch (error) {
    console.error('addWitnessStatement error:', error);
    return res.status(500).json({ message: 'Failed to add witness statement' });
  }
}

module.exports = {
  createSocialIssue,
  listSocialIssues,
  getSocialIssueById,
  updateSocialIssue,
  upvoteSocialIssue,
  addWitnessStatement,
  findBestNgoForIssue,
};
