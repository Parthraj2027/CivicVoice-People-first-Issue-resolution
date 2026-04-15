const mongoose = require('mongoose');
const { SOCIAL_CATEGORIES } = require('../utils/issueCatalog');

const ngoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    registrationNumber: { type: String, default: '' },
    specializations: [{ type: String, enum: SOCIAL_CATEGORIES }],
    serviceAreas: [
      {
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' },
      },
    ],
    contact: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    isVerified: { type: Boolean, default: false },
    responseTimeAvg: { type: Number, default: 0 },
    casesHandled: { type: Number, default: 0 },
    resolutionRate: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NGO', ngoSchema);
