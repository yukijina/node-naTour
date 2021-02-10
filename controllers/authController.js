const crypto = require('crypto');
const { promisify } = require('util'); //node_module built-in function util.promisify
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // set secure: true only for production (https://)
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  // Hide user password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // We could assign req.body to new User but this way is more secure. If somebody manually input ex. role 'admin' that is saved in the db. To prevent that, we only store the specific field to the db.
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  createSendToken(newUser, 201, res);
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
  createSendToken(user, 200, res);
});

// we can't manipulate cookie in browser. To log out, we send new cookie without token so that a user can safely log out.
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

// Protecte route middleware runction
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access', 401)
    );
  }
  // 2) Verification token - .verify returns promise
  // jwt.verify is asyn.  promisify converts callback fn to promise-based
  //By adding primisify promisify(jwt.verify) is function returns promiss and (token, process.env.JWT_SECRET) is callback function
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // decoded returns like this:
  // Promise {{ id: '5f07de0f2708af6151e33d62', iat: 1594400952, exp: 1602176952 }}

  // 3) Check if user still exists - Make sure nobody changes the token in unsafety manner
  // You can see the error message by deleting user from db after the user login
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belongs this token no longer exits', 401)
    );
  }
  // 4) Check if user chnaged password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed password password. Please login again',
        401
      )
    );
  }
  // Grant access to protected route
  req.user = currentUser;
  next();
});

// Ony for rendered pages, no error
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // 4) Check if user chnaged password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // There is a logged in user (template/pug can access to user)
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      // it won't block with error. Even there is an error, it moves to next function
      return next();
    }
  }
  next();
};

// Restrict access only to admin and lead-guide
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles/multi args in array => ['admin', 'lead-guide]. role="user"
    console.log('role:', roles, 'current user: ', req.user);
    // in the protect route, current user was saved to req.user
    // if matches, the role person can perform
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based a POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with email adddress.', 404));
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\nIf you didn't forget your password, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your passwprd reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending to the email. Try again later',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  // user's token is not encrypted token. But the token in db is encrypted so we encrypted users token here so that we can compare
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  // 2) if token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // use save(), not updateOne because we need to check user password above
  await user.save();
  // 3) Update changePasswordAt property for the user
  // 4) Log the user in
  createSendToken(user, 200, res);
});

// Logged in user changes the passwords
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }
  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdandUpdate will NOT work as intended! (Password confirm validation and .pre)

  // 4) Log user in and send JWT
  createSendToken(user, 200, res);
});
