const express = require("express");
const router = express.Router();
const { geminiChat, getSuggestions } = require("../controllers/chatController");

router.post("/gemini", geminiChat);
router.get("/suggestions", getSuggestions);

module.exports = router;
