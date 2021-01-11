const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('./../controllers/authController');

// Revew router can now access to the parameter (tours/:tourId/review - can get tour Id)
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'), // only role:user can write a review
    reviewController.setTourUserId,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = router;
