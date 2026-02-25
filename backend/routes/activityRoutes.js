const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

// POST /api/activities/quick_add/  — Log new activity
router.post('/quick_add', activityController.quickAdd);
router.post('/quick_add/', activityController.quickAdd);

// GET  /api/activities/  — List activities (with query filters)
router.get('/', activityController.listActivities);

// GET    /api/activities/:id/  — Get activity by ID
// DELETE /api/activities/:id/  — Delete activity
router.get('/:id', activityController.getActivity);
router.get('/:id/', activityController.getActivity);
router.delete('/:id', activityController.deleteActivity);
router.delete('/:id/', activityController.deleteActivity);

module.exports = router;
