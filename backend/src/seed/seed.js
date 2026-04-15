
const path = require('path');
const dotenv = require('dotenv');
dotenv.config(); // <-- let it load from current working dir (backend)

const connectDB = require('../config/db');
const { seedDatabase } = require('./seedData');

const seed = async () => {
  try {
    await connectDB();
    await seedDatabase({ force: true });

    console.log('Seed data created');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
