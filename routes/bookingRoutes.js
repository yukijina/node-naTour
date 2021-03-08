const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('./../controllers/authController');

// Revew router can now access to the parameter (tours/:tourId/review - can get tour Id)
const router = express.Router();

// every booking route use protect() function (middleware)
router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

// this middleware is use to the routes below
router.use(authController.restrict('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
