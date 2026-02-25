const express = require('express');
const router = express.Router();
const farmController = require('../controllers/farmController');

// GET  /api/farms/       — List all farms (filter by ?farmer_id= or ?farmer=)
// POST /api/farms/       — Create new farm
router.get('/', farmController.listFarms);
router.post('/', farmController.createFarm);

// GET    /api/farms/:id/   — Get farm by ID
// PUT    /api/farms/:id/   — Update farm
// DELETE /api/farms/:id/   — Delete farm
router.get('/:id', farmController.getFarm);
router.get('/:id/', farmController.getFarm);
router.put('/:id', farmController.updateFarm);
router.put('/:id/', farmController.updateFarm);
router.delete('/:id', farmController.deleteFarm);
router.delete('/:id/', farmController.deleteFarm);

module.exports = router;
