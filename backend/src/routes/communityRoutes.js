const express = require('express');
const { getCommunityFeed } = require('../controllers/publicController');

const router = express.Router();

router.get('/feed', getCommunityFeed);

module.exports = router;
