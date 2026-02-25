const express = require('express');
const router = express.Router();
const diseaseController = require('../controllers/diseaseController');

// We need multer to handle multipart/form-data for the image upload
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// POST /api/disease/detect
router.post('/detect', upload.single('image'), diseaseController.detectDisease);

module.exports = router;
