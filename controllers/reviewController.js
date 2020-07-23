const Review = require('../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  // If there is tourId in params, it returns reviews in that tourId. If tourId is not (api/v1/reviews), it returns all the reveiews
  // api/vi/tours/:toudId/reviews
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  // const reviews = features.query;
  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews
    }
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id; // user Id is comiing from protected middleware(auth)

  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'succcess',
    data: newReview
  });
});

exports.deleteReview = factory.deleteOne(Review);

// exports.getReview = catchAsync(async (req, res, next) => {
//   const review = await Review.findById(req.params.id);

//   if (!review) {
//     return next(new AppError('Review does not exist', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       review
//     }
//   });
// });

// exports.updateReview = catchAsync(async (req, res, next) => {
//   const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });

//   if (!review) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       review
//     }
//   });
// });

// exports.deleteReview = catchAsync(async (req, res, next) => {
//   const review = Review.findByIdAndDelete(req.params.id);

//   if (!review) {
//     return next(AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// });
