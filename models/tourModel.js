const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
//const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'], // 1st valus means max 40
      minlength: [10, 'A tour name must have less or equal than 40 characters']
      //validate: [validator.isAlpha, 'Tour name must only contain charactors'] =>it validates space too so it is not good idea to validate here. Just for example
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
      required: [true, 'A tour must have a difficulty'],
      enum: {
        // can't put all in array so we create as object
        values: ['easy', 'medium', 'difficult'], // enum - we can add value. User must type easy, medium or difficult
        message: 'Difficulty is either: easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour mast have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(value) {
          //if price discount value is less than price, value is ok/validated.
          // this only points to current doc on NEW document creation
          return value < this.prce;
        },
        ///({VALUE}) is the value that a user input (mongoose function)
        message: 'Discount price ({VALUE}) shoud e below regular price'
      }
    },
    summary: {
      type: String,
      trim: true, // trims beginning and the end of white space (not in the middle)
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
    },
    // Embedded Object
    startLocation: {
      //Geo Json - Object should includes at lelast type and coordinates
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    // Embedded - By using array, we specify the location is embedded
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // Embedded documents example (use middleware funciton .pre below) - also need to import User
    //guides: Array
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
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
  this.slug = slugify(this.name, { lower: true });
  next();
});

// If you wan to embedded the guides
// tourSchema.pre('save', async function(next) {
//   const guidesPromise = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

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
