const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // We could assign req.body to new User but this way is more secure. If somebody manually input ex. role 'admin' that is saved in the db. To prevent that, we only store the specific field to the db.
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exits
  if (!email || !password) {
    return next(new AppError(`Please prvide email and password`, 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password'); // desctucture: {email: email}
  //.correctPassword is from userSchema.method in the User model
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // If there is no error above, token is sent to the user
  const token = signToken(user._id);

  res.status(200).json({
    status: 'succcess',
    token
  });
});
