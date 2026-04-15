const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'critical', 'success'],
      default: 'info',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

alertSchema.statics.getActiveAlerts = function getActiveAlerts() {
  const now = new Date();
  return this.find({
    isActive: true,
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
  })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');
};

module.exports = mongoose.model('Alert', alertSchema);
