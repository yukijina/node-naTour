const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('./../controllers/authController');

// Revew router can now access to the parameter (tours/:tourId/review - can get tour Id)
const router = express.Router();

router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession
);

module.exports = router;
