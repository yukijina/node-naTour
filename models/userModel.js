const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email.'],
    unique: true,
    lowecase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please provide apassword'],
    minlength: 8
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    // This only works on CREATE and SAVE
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same.'
    }
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
