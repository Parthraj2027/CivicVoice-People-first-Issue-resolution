const cron = require('node-cron');
const Issue = require('../models/Issue');
const Alert = require('../models/Alert');
const Department = require('../models/Department');
const { deriveDepartmentForSocialCategory } = require('../utils/issueCatalog');

function startSocialIssueEscalationJob() {
  cron.schedule('0 * * * *', async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      const staleIssues = await Issue.find({
        issueTrack: 'social',
        assignedNGO: { $ne: null },
        status: { $nin: ['resolved', 'closed', 'escalated'] },
        updatedAt: { $lte: cutoff },
      });

      for (const issue of staleIssues) {
        const departmentName = deriveDepartmentForSocialCategory(issue.socialCategory);
        const department = await Department.findOne({ name: new RegExp(departmentName, 'i') });

        issue.assignedDepartment = department ? department._id : issue.assignedDepartment;
        issue.status = 'escalated';
        issue.escalationHistory.push({
          timestamp: new Date(),
          fromEntity: issue.assignedNGO?.toString?.() || 'ngo',
          toEntity: department ? department.name : departmentName,
          reason: 'Auto-escalated after 24 hours without NGO update',
        });

        await issue.save();

        await Alert.create({
          title: `Auto escalation: ${issue.publicId}`,
          message: `Social issue auto-escalated after 24 hours without NGO response.`,
          type: 'critical',
          createdBy: issue.createdBy || null,
        }).catch(() => null);
      }
    } catch (error) {
      console.error('Escalation job failed:', error);
    }
  });
}

module.exports = {
  startSocialIssueEscalationJob,
};
