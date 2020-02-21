const fs = require('fs');

// Top Level code - execute only once - Synchronous
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

exports.checkID = (req, res, next, val) => {
  console.log(`Tour id is ${val}`);
  /// When params Id is not valid (like: id: 101 - no data exsits)
  //if(id > tours.length) {
  if(req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID'
    });
  }
  next();
}

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name and Price'
    })
  }
  next();
}

exports.getAllTours =  (req, res) => {
  console.log("current time", req.requestTime)
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length, //not necessary but it is good to know how many data(tours) json has
    data: {
      tours  //(shorthand of tours: tours - 2nd tours are variable name tours/line19)
    }
  });
}

exports.getTour = (req, res) => {
  console.log(req.params)
  // req.params id is string. To change it to number, we multiply by 1. It converts to number.
  const id = req.params.id * 1;
  const tour = tours.find(el => el.id === id);

  res.status(200).json({
    status: 'success',
    data: {
      tour  // tour:: tour
    }
  });
}

exports.createTour = (req, res) => {
  //console.log(req.body);
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({id: newId}, req.body);

  tours.push(newTour);
  /// writeFile(file, data, [option], callback) data should be string or buffer 
  /// tours is normal js object - change to JSON string by JSON.stringify()
  fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
    //status 201 - create
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour
      }
    });
  });
}

exports.updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>'
    }
  })
}

exports.deleteTour = (req, res) => {
  res.status(204).json({
    status: 'success',
    data: null // the data no longer exsit because we deleted
  })
}
