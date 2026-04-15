const express = require('express');
const { getPublicImpact, getNearbyIssues, talkToJagruk } = require('../controllers/publicController');

const router = express.Router();

router.get('/impact', getPublicImpact);
router.get('/nearby', getNearbyIssues);
router.post('/chatbot', talkToJagruk);

module.exports = router;
