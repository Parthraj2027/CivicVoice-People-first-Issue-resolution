
const path = require('path');
const dotenv = require('dotenv');
dotenv.config(); // <-- let it load from current working dir (backend)


const connectDB = require('./config/db');
const app = require('./app');
const { startSocialIssueEscalationJob } = require('./jobs/socialIssueEscalationJob');
const { seedDatabase } = require('./seed/seedData');
const { ensureDefaultAdmin } = require('./utils/bootstrapAdmin');

const PORT = process.env.PORT || 4000;

const start = async () => {
  const { usingMemoryServer } = await connectDB();
  const shouldSeed = String(process.env.AUTO_SEED || '').toLowerCase() === 'true';

  if (usingMemoryServer) {
    console.warn('Running with in-memory MongoDB. Data will not persist after restart.');
  }

  await ensureDefaultAdmin();

  if (usingMemoryServer || shouldSeed) {
    await seedDatabase({ force: true });
    await ensureDefaultAdmin();
  }

  startSocialIssueEscalationJob();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
