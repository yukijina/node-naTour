const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only image', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// upload multiple images - use upload.fields([])
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

// upload.single('image') - single
// upload.fields([{},{}]) - multiple

exports.resizeTourImages = (req, res, next) => {
  console.log(req.files);
  next();
};

// Refactor using handleFactory
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage, price';
  req.query.fields = 'name, price, ratingsAverage, summary, difficulty';
  next();
};

//// Aggragation pipeline (Mongoose)
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      // $match is select a document
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      // group documents together - like calcurate average
      $group: {
        //_id: null, //what we want to group by - ex.you can replace null to '$difficulty' to group by difficulty
        _id: { $toUpper: '$difficulty' },
        // each document go through this pipline, 1 is adding to this counter(numTours) => result - total number of tours
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 } //"1" for ascending, "-1" for descending
    }
    //{
    //$match: { _id: { $ne: 'EASY' } } //$ne - not equal
    //}
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      // unwind - diconstract array field from input field to each document
      // => startData has 3 strings in array. by unwind, it create each object
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        // check Mongoose aggregation operator
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        // $push creates array => {tours: [ "they Sea Explorer", "The Park Camper"]}
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      // project - not display selected document (in this case, _id. because we add fields of Month so we hide _id. )
      $project: { _id: 0 }
    },
    {
      $sort: { numTourStarts: -1 } //-1 descending
    },
    {
      // limit the number of documents displayed
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

exports.getToursWithin = async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longtitude in the format lat, lng',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
};

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // 0.001 same as devide with 1000 (/1000)
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longtitude in the format lat, lng',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});

/////************* */ Before using factory
//exports.getTour = catchAsync(async (req, res, next) => {
//   //console.log(req.query); - populate is for referencing
//   console.log('id:', req.params.id);
//   const tour = await Tour.findById(req.params.id).populate('reviews'); // virtual check tourModel
//   // When there is no matched route(tour - same id digits but wrong id number)
//   // we should add this error for the route that includes id
//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// });

//exports.createTour = catchAsync(async (req, res, next) => {
// const newTour = new Tour({})
// newTour.save()
/// we can call create method and it returns promise
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour
//     }
//   });
// });

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true, //after update, it returns the documents
//     runValidators: true // if you make it false, validation does not work
//   });

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   //const tour = await Tour.findById(req.params.id);
//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// });

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   ///// EXECUTE QUERY
//   //Chaining the function in the class - create instance - filter - sort
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;
//   //const tours = await query;
//   //query.sort().select().skip().limit() - it returns each method and chain to next.

//   //// SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,
//     results: tours.length,
//     data: {
//       tours
//     }
//   });
// });

/////************* */ Before connecting with database
/// Top Level code - execute only once - Synchronous - this is for testing purpose..
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

//exports.checkID = (req, res, next, val) => {
//console.log(`Tour id is ${val}`);
/// When params Id is not valid (like: id: 101 - no data exsits)
//if(id > tours.length) {
//if (req.params.id * 1 > tours.length) {
//   return res.status(404).json({
//     status: 'fail',
//     message: 'Invalid ID'
//   });
// }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name and Price'
//     });
//   }
//   next();
// };

// exports.getAllTours = (req, res) => {
//   console.log('current time', req.requestTime);
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime
// results: tours.length, //not necessary but it is good to know how many data(tours) json has
// data: {
//   tours //(shorthand of tours: tours - 2nd tours are variable name tours/line19)
// }
//   });
// };

//exports.getTour = (req, res) => {
//  console.log(req.params);
// req.params id is string. To change it to number, we multiply by 1. It converts to number.
//  const id = req.params.id * 1;
// const tour = tours.find(el => el.id === id);

// res.status(200).json({
//   status: 'success',
//   data: {
//     tour // tour:: tour
//   }
// });
// };

// exports.createTour = (req, res) => {
//console.log(req.body);
// const newId = tours[tours.length - 1].id + 1;
// const newTour = Object.assign({ id: newId }, req.body);
//tours.push(newTour);
/// writeFile(file, data, [option], callback) data should be string or buffer
/// tours is normal js object - change to JSON string by JSON.stringify()
// fs.writeFile(
//   `${__dirname}/dev-data/data/tours-simple.json`,
//   JSON.stringify(tours),
//   err => {
//     //status 201 - create
//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour
//       }
//     });
//   }
// );
//};

// exports.updateTour = (req, res) => {
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: '<Updated tour here...>'
//     }
//   });
// };

// exports.deleteTour = (req, res) => {
//   res.status(204).json({
//     status: 'success',
//     data: null // the data no longer exsit because we deleted
//   });
// };
