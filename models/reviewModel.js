const mongoose = require('mongoose');
const Tour = require('./tourModel');

// Review belongs to tour and user
// User has many reviews, Tour has many reviews.
// One to many relationship. Review refers to Parent ID (tour and user - I think it is like join table)
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1'],
      max: [5, ' Rating must be below 5']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    //tour and user - add parentId. Review won't exist without tour and user (required true)
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    // virtuals true => it displays virtual schema. Basically the fileds are not store db but display
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// populate both tour and user
reviewSchema.pre(/^find/, function(next) {
  // this points to current query
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    // if nothing, show default value
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

// invoke - calcurate after saved
reviewSchema.post('save', function() {
  //this points to current review (Can't call Review so we use this.constructor)
  this.constructor.calcAverageRatings(this.tour);
});

// one user can have only one review
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // we can acess r that was crated at pre
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
