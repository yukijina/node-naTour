const mongoose = require('mongoose');

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
  this.populate({
    path: 'tour',
    select: 'name'
  }).populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
