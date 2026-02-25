const express = require('express');
const router = express.Router();
const { chat, getSuggestions } = require('../controllers/chatController');

// POST /api/chatbot/gemini — Send message and get Gemini response
router.post('/gemini', chat);

// GET /api/chatbot/suggestions — Get dynamic suggestions
router.get('/suggestions', getSuggestions);

module.exports = router;
