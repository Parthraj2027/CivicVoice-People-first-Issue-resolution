const User = require('../models/User');
const Department = require('../models/Department');
const Issue = require('../models/Issue');
const NGO = require('../models/NGO');
const Volunteer = require('../models/Volunteer');

const seedDatabase = async (options = {}) => {
  const forceFromEnv = String(process.env.FORCE_SEED || '').toLowerCase() === 'true';
  const forceSeed = Boolean(options.force || forceFromEnv);
  const existingUsers = await User.countDocuments();

  if (existingUsers > 0 && !forceSeed) {
    console.log('Seed skipped: existing data found (set FORCE_SEED=true to reseed)');
    return;
  }

  await User.deleteMany({});
  await Department.deleteMany({});
  await Issue.deleteMany({});
  await NGO.deleteMany({});
  await Volunteer.deleteMany({});

  const citizens = await User.create([
    {
      name: 'Citizen One',
      email: 'citizen1@civicvoice.local',
      password: 'Citizen@123',
      role: 'citizen',
    },
    {
      name: 'Citizen Two',
      email: 'citizen2@civicvoice.local',
      password: 'Citizen@123',
      role: 'citizen',
    },
    {
      name: 'Citizen Three',
      email: 'citizen3@civicvoice.local',
      password: 'Citizen@123',
      role: 'citizen',
    },
  ]);

  const departments = await Department.create([
    { name: 'Roads & Transport', description: 'Potholes, signals, congestion' },
    { name: 'Water & Sewage', description: 'Leaks, contamination, flooding' },
    { name: 'Power', description: 'Outages, streetlights, power safety' },
    { name: 'Women & Child Welfare', description: 'Safety, child welfare, support cases' },
    { name: 'Health', description: 'Healthcare and emergency support' },
    { name: 'Social Welfare', description: 'Homelessness, elder neglect, support programs' },
    { name: 'Education', description: 'School access and education support' },
  ]);

  const [roads, water, power] = departments;

  await User.create([
    {
      name: 'System Admin',
      email: 'admin@civicvoice.local',
      password: 'Admin@123',
      role: 'admin',
    },
    {
      name: 'Roads Officer',
      email: 'roads@civicvoice.local',
      password: 'Dept@123',
      role: 'department',
      department: roads._id,
    },
    {
      name: 'Water Officer',
      email: 'water@civicvoice.local',
      password: 'Dept@123',
      role: 'department',
      department: water._id,
    },
    {
      name: 'Power Officer',
      email: 'power@civicvoice.local',
      password: 'Dept@123',
      role: 'department',
      department: power._id,
    },
  ]);

  const ngoLead = await User.create({
    name: 'Asha Support Lead',
    email: 'ngo@civicvoice.local',
    password: 'Ngo@123',
    role: 'ngo',
    location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  });

  const volunteerUser = await User.create({
    name: 'Community Volunteer',
    email: 'volunteer@civicvoice.local',
    password: 'Volunteer@123',
    role: 'volunteer',
    location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  });

  const ngos = await NGO.create([
    {
      name: 'Asha Foundation',
      description: 'Supports women, children, and shelter-linked outreach cases.',
      registrationNumber: 'NGO-ASHA-001',
      specializations: ['womens_safety', 'child_labour', 'homelessness'],
      serviceAreas: [{ city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }],
      contact: { phone: '1800-111-222', email: 'help@asha.org', website: 'https://asha.org' },
      isVerified: true,
      responseTimeAvg: 35,
      casesHandled: 120,
      resolutionRate: 91,
      isActive: true,
      managedBy: ngoLead._id,
    },
    {
      name: 'Bright Steps Trust',
      description: 'Education and mental wellness support.',
      registrationNumber: 'NGO-BRIGHT-002',
      specializations: ['education', 'mental_health', 'disability'],
      serviceAreas: [{ city: 'Pune', state: 'Maharashtra', pincode: '411001' }],
      contact: { phone: '1800-222-333', email: 'hello@brightsteps.org', website: 'https://brightsteps.org' },
      isVerified: true,
      responseTimeAvg: 48,
      casesHandled: 84,
      resolutionRate: 88,
      isActive: true,
    },
  ]);

  await Volunteer.create({
    userId: volunteerUser._id,
    specialSkills: ['community outreach', 'first response'],
    availability: 'Weekends and evenings',
    areasServed: ['Mumbai', 'Thane'],
    tasksCompleted: 12,
    badges: ['community_guardian'],
  });

  await Issue.create([
    {
      title: 'Broken streetlight near market road',
      issueType: 'streetlight',
      issueTrack: 'civic',
      civicCategory: 'streetlight',
      location: 'Market Road, Mumbai',
      severity: 'medium',
      urgencyLevel: 'medium',
      description: 'Streetlight has been out for three nights causing safety concerns.',
      summary: 'Broken streetlight near market road',
      status: 'pending',
      createdBy: citizens[0]._id,
      reportedBy: citizens[0]._id,
      forwardedTo: power._id,
      assignedDepartment: power._id,
    },
    {
      title: 'Support needed for women safety case',
      issueType: 'social',
      issueTrack: 'social',
      socialCategory: 'womens_safety',
      location: { address: 'Colaba Causeway', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      severity: 'high',
      urgencyLevel: 'high',
      description: 'A woman needs immediate support after repeated harassment in the area.',
      summary: 'Women safety support case',
      status: 'assigned',
      createdBy: citizens[1]._id,
      reportedBy: citizens[1]._id,
      assignedNGO: ngos[0]._id,
      helplineTriggered: ['181', '100'],
      communityUpvotes: 4,
    },
  ]);

  console.log('Seed data created');
};

module.exports = { seedDatabase };