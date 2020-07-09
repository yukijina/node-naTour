const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

exports.signup = async (req, res, next) => {
  const newUser = await User.create(res.body);

  res.status(201).json({
    status: 'success',
    data: {
      user: newUser
    }
  }),

};
