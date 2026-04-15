
const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    category: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    assignedIssues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Issue' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
