const express = require('express');
const router = express.Router();
const {
  listOfficers,
  getOfficer,
  bookConsultation,
  listConsultations,
  cancelConsultation
} = require('../controllers/officerController');

router.get('/', listOfficers);
router.get('/:id', getOfficer);
router.post('/consultations', bookConsultation);
router.get('/consultations/list', listConsultations);
router.patch('/consultations/:id/cancel', cancelConsultation);

module.exports = router;
