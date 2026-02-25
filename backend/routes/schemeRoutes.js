const express = require('express');
const router = express.Router();
const { listSchemes, getScheme, searchSchemes } = require('../controllers/schemeController');

router.get('/', listSchemes);
router.get('/search', searchSchemes);
router.get('/:id', getScheme);

module.exports = router;
