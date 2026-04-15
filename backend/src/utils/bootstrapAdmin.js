const User = require('../models/User');

async function ensureDefaultAdmin() {
  const email = String(process.env.DEFAULT_ADMIN_EMAIL || 'admin@civicvoice.local')
    .trim()
    .toLowerCase();
  const password = String(process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123').trim();
  const name = String(process.env.DEFAULT_ADMIN_NAME || 'System Admin').trim();

  let admin = await User.findOne({ email });

  if (!admin) {
    admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
    });
    console.log(`Default admin created: ${email}`);
    return;
  }

  if (admin.role !== 'admin') {
    admin.role = 'admin';
    await admin.save();
    console.log(`Default admin role corrected to admin: ${email}`);
  }
}

module.exports = { ensureDefaultAdmin };
