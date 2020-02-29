const Tour = require('./../models/tourModel');

exports.getAllTours = async (req, res) => {
  try {
    //it returns query object => { duration: '5', difficulty: 'easy' }
    console.log(req.query);

    ///// BUILD TO QUERY - query parameter can access using "req.query"
    // const tours = await Tour.find({
    //   duration: 5,
    //   difficulty: 'easy'
    // });

    // const tours = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    //// 1A) Filtering
    //// we don't want to change the actual query so copy ot.
    const queryObj = { ...req.query };
    // prevent unnecessary input
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach(el => delete queryObj[el]);
    // make sure if the original query is not revised
    console.log('req.query: ', req.query, 'queryObj: ', queryObj);
    //const query = Tour.find(queryObj);

    //// 1B) Advanced filtering
    /// greater and less than query
    /// 127.0.0.01:3000/api/v1/tours?duration[gte]=5
    // shoud be: { difficulty: 'easy}, duration { $gte: 5 } }
    // but it returns: (without $){ difficulty: 'easy}, duration { gte: '5' } }

    let queryStr = JSON.stringify(queryObj);
    // \b - exact match \g - replace all matches. Replace accepts callback
    // ${match} is template string. first $ is actually add/replace with $
    queryStr = queryStr.replace(/\b(gte|gt|let|lt)\b/g, match => `$${match}`);
    console.log(JSON.parse(queryStr));

    let query = Tour.find(JSON.parse(queryStr));

    //// 2) Sorting
    // url is like: 127.0.0.01:3000/api/v1/tours?sort=price => price sorted row to high
    // url 127.0.0.01:3000/api/v1/tours?sort=-price => sort other way high to low
    if (req.query.sort) {
      // sort is method from mongoose
      // sort several items - 127.0.0.01:3000/api/v1/tours?sort=-price, ratingAverage => return sort('price ratingsAverage')
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      // if there is no sort params, it sorted by createdAt new to old
      query.sort('-createdAt');
    }

    //// 3) Field limiting
    // url 127.0.0.01:3000/api/v1/tours?fields=name, duration,difficulty,price => display only the selected data
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      // remove __v data -> it removes not only fields is empty but also field has params
      // - meaningn NOT include. --v is automatically added to mongoose db just because mongoose use this data.
      query = query.select('-__v');
    }

    /// 4) Pagination
    /// *1 can change string to number. after || => default number is 1
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit; // page-1 means previous page
    /// page=2&limit=10  page1 1-10, page2 11-20 so we need to skip first 10 to display page 2 (11th data)
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      // countDocuments - Mongoose function. It returns the amount of tours
      const numTours = await Tour.countDocuments();
      if (skip >= numTours) throw new Error('This page does not exist');
    }

    ///// EXECUTE QUERY
    const tours = await query;
    //query.sort().select().skip().limit() - it returns each method and chain to next.

    //// SEND RESPONSE
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: tours.length,
      data: {
        tours
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: 'invalid'
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    console.log(req.query);
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'Fail',
      message: 'Invalid'
    });
  }
};

exports.createTour = async (req, res) => {
  // const newTour = new Tour({})
  // newTour.save()
  try {
    /// we can call create method and it returns promise
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid data'
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'Fail',
      message: 'Invalid'
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(404).json({
      status: 'Fail',
      message: 'Invalid request'
    });
  }
};

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
