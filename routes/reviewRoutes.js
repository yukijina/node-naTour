const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('./../controllers/authController');

// Revew router can now access to the parameter (tours/:tourId/review - can get tour Id)
const router = express.Router({ mergeParams: true });

// middleware
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'), // only role:user can write a review
    reviewController.setTourUserId,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
