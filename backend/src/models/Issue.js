
const mongoose = require('mongoose');

const departmentUpdateSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'completed', 'reopened'],
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const witnessSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    statement: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const escalationSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    fromEntity: { type: String, default: '' },
    toEntity: { type: String, default: '' },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    issueType: { type: String, required: true },
    issueTrack: {
      type: String,
      enum: ['civic', 'social'],
      default: 'civic',
    },
    civicCategory: {
      type: String,
      enum: ['pothole', 'streetlight', 'sewage', 'garbage', 'water', 'other'],
      default: 'other',
    },
    socialCategory: {
      type: String,
      enum: [
        'child_labour',
        'womens_safety',
        'homelessness',
        'education',
        'healthcare',
        'environment',
        'elder_neglect',
        'hunger',
        'disability',
        'mental_health',
        'discrimination',
        'substance_abuse',
      ],
      default: null,
    },
    location: { type: mongoose.Schema.Types.Mixed, required: true },
    geoLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      source: {
        type: String,
        enum: ['device_location', 'map_click', 'manual', 'search'],
      },
    },
    landmark: { type: String },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical', 'emergency'],
      required: true,
    },
    urgencyLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'emergency'],
      default: 'low',
    },
    description: { type: String, required: true },
    impact: { type: String },
    recurrence: {
      type: String,
      enum: ['new', 'recurring', 'ongoing'],
      default: 'new',
    },
    evidenceUrls: [{ type: String }],
    resolutionEvidence: [{ type: String }],
    contactName: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String },
    preferredContactMethod: {
      type: String,
      enum: ['phone', 'email', 'none'],
      default: 'none',
    },
    status: {
      type: String,
      enum: [
        'submitted',
        'reviewing',
        'assigned',
        'in_progress',
        'resolved',
        'escalated',
        'closed',
        'pending',
        'in_review',
        'forwarded',
        'completed',
        'reopened',
      ],
      default: 'pending',
    },
    summary: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isAnonymous: { type: Boolean, default: false },
    forwardedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    assignedDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    assignedNGO: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO' },
    communityUpvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    witnesses: [witnessSchema],
    escalationHistory: [escalationSchema],
    helplineTriggered: [{ type: String }],
    resolutionProofUrls: [{ type: String }],
    resolvedAt: { type: Date },
    departmentUpdates: [departmentUpdateSchema],
    rating: { 
      type: Number, 
      min: 1, 
      max: 5 
    },
    review: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

issueSchema.virtual('publicId').get(function () {
  return `CV-${this._id.toString().slice(-6).toUpperCase()}`;
});

issueSchema.set('toJSON', { virtuals: true });
issueSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Issue', issueSchema);
