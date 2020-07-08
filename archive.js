// This file is archive code only. Just for referencing

// Very Basic
//const fs = require('fs');
//const express = require('express');

//const app = express();

//// middleware - modify the incoming data - app uses that middleware
//app.use(express.json());

/////// Basic
// app.get('/', (req, res) => {
//   res.status(200).json({message: 'Hello from the server side!', app: "Natours"});
//  });

// app.post('/', (req,res) => {
//   res.send('You can post to this endpoint...')
// })

// query object is like this: { duration: '5', difficulty: 'easy' }

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
// const queryObj = { ...req.query };
// // prevent unnecessary input
// const excludeFields = ['page', 'sort', 'limit', 'fields'];
// excludeFields.forEach(el => delete queryObj[el]);
// // make sure if the original query is not revised
// console.log('req.query: ', req.query, 'queryObj: ', queryObj);
//const query = Tour.find(queryObj);

//// 1B) Advanced filtering
/// greater and less than query
/// 127.0.0.01:3000/api/v1/tours?duration[gte]=5
// shoud be: { difficulty: 'easy}, duration { $gte: 5 } }
// but it returns: (without $){ difficulty: 'easy}, duration { gte: '5' } }

// let queryStr = JSON.stringify(queryObj);
// // \b - exact match \g - replace all matches. Replace accepts callback
// // ${match} is template string. first $ is actually add/replace with $
// queryStr = queryStr.replace(/\b(gte|gt|let|lt)\b/g, match => `$${match}`);
// console.log(JSON.parse(queryStr));

// let query = Tour.find(JSON.parse(queryStr));

//// 2) Sorting
// url is like: 127.0.0.01:3000/api/v1/tours?sort=price => price sorted row to high
// url 127.0.0.01:3000/api/v1/tours?sort=-price => sort other way high to low
// if (req.query.sort) {
//   // sort is method from mongoose
//   // sort several items - 127.0.0.01:3000/api/v1/tours?sort=-price, ratingAverage => return sort('price ratingsAverage')
//   const sortBy = req.query.sort.split(',').join(' ');
//   query = query.sort(sortBy);
// } else {
//   // if there is no sort params, it sorted by createdAt new to old
//   query.sort('-createdAt');
// }

//// 3) Field limiting
// url 127.0.0.01:3000/api/v1/tours?fields=name, duration,difficulty,price => display only the selected data
// if (req.query.fields) {
//   const fields = req.query.fields.split(',').join(' ');
//   query = query.select(fields);
// } else {
//   // remove __v data -> it removes not only fields is empty but also field has params
//   // - meaningn NOT include. --v is automatically added to mongoose db just because mongoose use this data.
//   query = query.select('-__v');
// }

/// 4) Pagination
/// *1 can change string to number. after || => default number is 1
// const page = req.query.page * 1 || 1;
// const limit = req.query.limit * 1 || 100;
// const skip = (page - 1) * limit; // page-1 means previous page
// /// page=2&limit=10  page1 1-10, page2 11-20 so we need to skip first 10 to display page 2 (11th data)
// query = query.skip(skip).limit(limit);

// if (req.query.page) {
//   // countDocuments - Mongoose function. It returns the amount of tours
//   const numTours = await Tour.countDocuments();
//   if (skip >= numTours) throw new Error('This page does not exist');
// }
