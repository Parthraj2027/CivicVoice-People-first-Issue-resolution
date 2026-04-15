const Issue = require('../models/Issue');
const NGO = require('../models/NGO');
const Volunteer = require('../models/Volunteer');
const { generateJagrukReply } = require('../services/jagrukAssistant');

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveCoordinates(issue) {
  if (!issue) return null;

  const geoLat = toNumber(issue.geoLocation?.latitude);
  const geoLng = toNumber(issue.geoLocation?.longitude);
  if (geoLat !== null && geoLng !== null) {
    return { latitude: geoLat, longitude: geoLng };
  }

  const locationLat = toNumber(issue.location?.lat ?? issue.location?.latitude);
  const locationLng = toNumber(issue.location?.lng ?? issue.location?.longitude);
  if (locationLat !== null && locationLng !== null) {
    return { latitude: locationLat, longitude: locationLng };
  }

  return null;
}

function haversineKm(a, b) {
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);

  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return earthRadiusKm * c;
}

async function getPublicImpact(req, res) {
  const [resolvedTotal, civicResolved, socialResolved, ngosActive, volunteersActive] = await Promise.all([
    Issue.countDocuments({ status: { $in: ['resolved', 'completed'] } }),
    Issue.countDocuments({ $or: [{ issueTrack: 'civic' }, { civicCategory: { $exists: true, $ne: null } }], status: { $in: ['resolved', 'completed'] } }),
    Issue.countDocuments({ issueTrack: 'social', status: { $in: ['resolved', 'completed'] } }),
    NGO.countDocuments({ isActive: true }),
    Volunteer.countDocuments({}),
  ]);

  const totalIssues = await Issue.countDocuments({});

  const recentIssues = await Issue.find()
    .sort({ createdAt: -1 })
    .limit(6)
    .select('title issueType issueTrack civicCategory socialCategory severity status createdAt location communityUpvotes')
    .lean();

  return res.json({
    totalIssues,
    resolvedTotal,
    civicResolved,
    socialResolved,
    ngosActive,
    volunteersActive,
    resolutionRate: totalIssues > 0 ? Math.round((resolvedTotal / totalIssues) * 100) : 0,
    recentIssues,
  });
}

async function getCommunityFeed(req, res) {
  const { city, track, status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (track === 'civic' || track === 'social') {
    query.issueTrack = track;
  }
  if (status) {
    query.status = status;
  }
  if (city) {
    query.$or = [
      { 'location.city': new RegExp(city, 'i') },
      { location: new RegExp(city, 'i') },
    ];
  }

  const issues = await Issue.find(query)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .populate('assignedNGO', 'name logoUrl')
    .populate('assignedDepartment', 'name')
    .populate('createdBy', 'name email')
    .populate('reportedBy', 'name email')
    .lean();

  return res.json({
    items: issues,
    page: Number(page),
    limit: Number(limit),
  });
}

async function getNearbyIssues(req, res) {
  const lat = toNumber(req.query.lat);
  const lng = toNumber(req.query.lng);

  if (lat === null || lng === null) {
    return res.status(400).json({ message: 'lat and lng query params are required' });
  }

  const radiusKm = Math.min(Math.max(toNumber(req.query.radiusKm) ?? 8, 0.5), 40);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const issues = await Issue.find({ status: { $ne: 'closed' } })
    .sort({ createdAt: -1 })
    .limit(500)
    .select('title issueType issueTrack civicCategory socialCategory status severity location geoLocation communityUpvotes createdAt')
    .lean();

  const origin = { latitude: lat, longitude: lng };

  const nearby = issues
    .map((issue) => {
      const coords = resolveCoordinates(issue);
      if (!coords) return null;

      const distanceKm = haversineKm(origin, coords);
      if (distanceKm > radiusKm) return null;

      return {
        ...issue,
        coordinates: coords,
        distanceKm: Number(distanceKm.toFixed(2)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return res.json({
    center: origin,
    radiusKm,
    items: nearby,
  });
}

async function talkToJagruk(req, res) {
  try {
    const { message, history = [], context = '' } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const result = await generateJagrukReply({
      message: String(message).trim(),
      history,
      context: String(context || '').trim(),
    });

    return res.json({
      reply: result.reply,
      sources: result.sources,
    });
  } catch (error) {
    console.error('talkToJagruk error:', error);
    return res.status(500).json({ message: 'Failed to generate assistant reply' });
  }
}

module.exports = {
  getPublicImpact,
  getCommunityFeed,
  getNearbyIssues,
  talkToJagruk,
};
