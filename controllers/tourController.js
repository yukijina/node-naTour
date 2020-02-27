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

    //// 1) Filtering
    //// we don't want to change the actual query so copy ot.
    const queryObj = { ...req.query };
    // prevent unnecessary input
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach(el => delete queryObj[el]);
    // make sure if the original query is not revised
    console.log('req.query: ', req.query, 'queryObj: ', queryObj);
    //const query = Tour.find(queryObj);

    //// 2) Advanced filtering
    /// greater and less than query
    /// 127.0.0.01:3000/api/v1/tours?duration[gte]=5
    // shoud be: { difficulty: 'easy}, duration { $gte: 5 } }
    // but it returns: (without $){ difficulty: 'easy}, duration { gte: '5' } }

    let queryStr = JSON.stringify(queryObj);
    // \b - exact match \g - replace all matches. Replace accepts callback
    // ${match} is template string. first $ is actually add/replace with $
    queryStr = queryStr.replace(/\b(gte|gt|let|lt)\b/g, match => `$${match}`);
    console.log(JSON.parse(queryStr));

    const query = Tour.find(JSON.parse(queryStr));

    ///// EXECUTE QUERY
    const tours = await query;

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
