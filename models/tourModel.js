const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty']
    },
    ratingsAverage: {
      type: Number,
      default: 4.5
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour mast have a price']
    },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String], //string in array
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false //=> hide from api data
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false //defaul secret tours are not secret
    }
  },
  {
    // virtuals true => it displays virtual schema
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual properties - not stored database. it is great such as conversion from miles to km.
// get is getter here
// arrow function does not get "this" keyword so we use regular function.
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//Doument middleware(pre middleware): run before .save() and create(), but not insertMany(), update etc
// this - currently processed document ex.if you post a new data, that whole data is "this"
// we can use this middleware for before saving the document(data)
// so called Pre save Hooks
tourSchema.pre('save', function(next) {
  console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

///// Just for text - middleware runs next()
// another pre save hook middleware
// tourSchema.pre('save', function(next) {
//   console.log('Will save the documents...')
//   next();
// })

//// post middleware is executed when all the previous middleware function is completed
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

//// QUERY MIDDLEWARE - Hook is find in this case. "this" keyword is pointing query not the document.
// /^find/ - regular expression (no need quotation), When we rquest one tour like get/:id, we use "findById" function so by useing /^/, it can be used for find or findOne (tourController line 121) & Mongoose doc
tourSchema.pre(/^find/, function(next) {
  //tourSchema.pre('find', function(next) {
  //"this" is pointing query object
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

//just to show how post works
tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

//// AGGREGATION MIDDLEWARE
/// this is poiting current aggregation
tourSchema.pre('aggregate', function(next) {
  // Here, we are trying not to display secretTour when aggragation (like route: /tour-starts) is requested.
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(('aggregate: ', this));
  next();
});

// Model uses uppercase - convention
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
