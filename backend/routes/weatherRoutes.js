const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// GET /api/weather/current?district=X&state=Y
router.get('/current', weatherController.getCurrentWeather);

// GET /api/weather/daily?district=X&state=Y
router.get('/daily', weatherController.getDailyForecast);

// GET /api/weather/hourly?district=X&state=Y
router.get('/hourly', weatherController.getHourlyForecast);

module.exports = router;
