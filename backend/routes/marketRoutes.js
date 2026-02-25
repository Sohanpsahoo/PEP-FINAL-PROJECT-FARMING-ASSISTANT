const express = require('express');
const router = express.Router();
const {
  getCrops,
  getPrices,
  getPriceHistory,
  getInsights,
  createTransaction,
  listTransactions
} = require('../controllers/marketController');

router.get('/crops', getCrops);
router.get('/prices', getPrices);
router.get('/price-history', getPriceHistory);
router.post('/insights', getInsights);
router.post('/transactions', createTransaction);
router.get('/transactions', listTransactions);

module.exports = router;
