const express = require('express');
const router = express.Router();
const {
  generateRecommendations,
  listRecommendations,
  updateRecommendation,
  deleteRecommendation,
  clearRecommendations
} = require('../controllers/recommendationController');

router.post('/generate', generateRecommendations);
router.get('/', listRecommendations);
router.patch('/:id', updateRecommendation);
router.delete('/clear', clearRecommendations);
router.delete('/:id', deleteRecommendation);

module.exports = router;
