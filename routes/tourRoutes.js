const express = require('express');
const tourController = require('./../controllers/tourController');
// or const { getAllTours, createTour, getTour, updateTour, deleteTour }= require('./../controllers/tourController');
const authController = require('../controllers/authController');
//const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// check if params has appropriate Id
// val stands for value - it holds the parameter
//router.param('id', tourController.checkID);

// Create a checkBody Parameter
// Check if body contains the name and price property
// If not send back 400 (bad request)
// Add it to the post handler stack

//Nested routes
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

// Nested route (refactor) - Check reveiwRouter(not controller) => reviewRouter needs to access tourId (use 'mergeParams: true)
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
//tours-within/distance=233&center=-40,45&unit=mi
//tours-within/233/center/-40,45/unit/mi - cleaner, standard

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
