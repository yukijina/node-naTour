const express = require('express');
const tourController = require('./../controllers/tourController');
// or const { getAllTours, createTour, getTour, updateTour, deleteTour }= require('./../controllers/tourController');
const router = express.Router();

// check if params has appropriate Id
// val stands for value - it holds the parameter
router.param('id', tourController.checkID);

// Create a checkBody Parameter

// Check if body contains the name and price property

// If not send back 400 (bad request)

// Add it to the post handler stack


 router
 .route('/')
 .get(tourController.getAllTours)
 .post(tourController.checkBody, tourController.createTour); 
 
 router
 .route('/:id')
 .get(tourController.getTour)
 .patch(tourController.updateTour)
 .delete(tourController.deleteTour);

 module.exports = router;