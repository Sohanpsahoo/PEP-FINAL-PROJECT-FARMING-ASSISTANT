const express = require("express");
const router = express.Router();
const {
  getCropRecommendation,
  getRecommendationHistory,
} = require("../controllers/recommendationController");

// POST /api/recommendations/crop
router.post("/crop", getCropRecommendation);

// GET /api/recommendations/history/:farmerId
router.get("/history/:farmerId", getRecommendationHistory);

module.exports = router;
