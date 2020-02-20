const fs = require('fs');
const express = require('express');

const app = express();

//// middleware - modify the incoming data - app uses that middleware
app.use(express.json());

// Top Level code - execute only once - Synchronous
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

const getAllTours =  (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length, //not necessary but it is good to know how many data(tours) json has
    data: {
      tours  //(shorthand of tours: tours - 2nd tours are variable name tours/line19)
    }
  });
}

const getTour = (req, res) => {
  console.log(req.params)
  // req.params id is string. To change it to number, we multiply by 1. It converts to number.
  const id = req.params.id * 1;
  const tour = tours.find(el => el.id === id);

  /// When params Id is not valid (like: id: 101 - no data exsits)
  //if(id > tours.length) {
  if(!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID'
    })
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      tour  // tour:: tour
    }
  });
}

const createTour = (req, res) => {
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

const updateTour = (req, res) => {
  if(req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>'
    }
  })
}

const deleteTour = (req, res) => {
  if(req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID'
    });
  }

  res.status(204).json({
    status: 'success',
    data: null // the data no longer exsit because we deleted
  })
}

//// Always should specify the version
//// GET all the  tour
//app.get('/api/v1/tours', getAllTours);

//// GET one tour
//app.get('/api/v1/tours/:id', getTour);

//// POST
//app.post('/api/v1/tours', createTour);

// Update the data - patch (only update the property, put changes entire data)
//app.patch(`/api/v1/tours/:id`, updateTour);

// Delete the data 
//app.delete(`/api/v1/tours/:id`, deleteTour);

/// Refactor
app.route('/api/v1/tours').get(getAllTours).post(createTour);
app.route('/api/v1/tours/:id').get(getTour).patch(updateTour).delete(deleteTour);

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`)
});