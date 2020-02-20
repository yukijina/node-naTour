const fs = require('fs');
const express = require('express');

const app = express();

//// middleware - modify the incoming data - app uses that middleware
app.use(express.json());

/////// Basic 
// app.get('/', (req, res) => {
//   res.status(200).json({message: 'Hello from the server side!', app: "Natours"});
// });

// app.post('/', (req,res) => {
//   res.send('You can post to this endpoint...')
// })

// Top Level code - execute only once - Synchronous
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

//// Always shoud specify the version
//// GET all the tours
app.get('/api/v1/tours/:id', (req, res) => {
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
});

//// GET one tour
app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length, //not necessary but it is good to know how many data(tours) json has
    data: {
      tours  //(shorthand of tours: tours - 2nd tours are variable name tours/line19)
    }
  });
});


//// POST
app.post('/api/v1/tours', (req, res) => {
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
});

// Update the data - patch (only update the property, put changes entire data)
app.patch(`/api/v1/tours/:id`, (req, res) => {
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
})

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`)
});