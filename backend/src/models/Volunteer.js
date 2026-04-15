const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    specialSkills: [{ type: String }],
    availability: { type: String, default: '' },
    areasServed: [{ type: String }],
    tasksCompleted: { type: Number, default: 0 },
    badges: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Volunteer', volunteerSchema);
