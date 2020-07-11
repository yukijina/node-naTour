const crypto = require('crypto'); // this is from node_module not npm
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin']
    // default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide apassword'],
    minlength: 8,
    select: false
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
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  // When user delete their account, we set active to false, rather than deleting entire account from db
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// Reset password ChangedAt
userSchema.pre('save', function(next) {
  // If password is not modified and the password is new
  if (!this.isModified('password') || this.isNew) return next();
  // token is always created after the passwordChange is saved
  //Password change takes a bit time so we minus 1000. Make sure password is saved before token issues
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('save', async function(next) {
  // Only run this function if password was modified
  if (!this.isModified('password')) return next();
  // There is two ways to create hash. 1)create salt and add to the hash 2)add number 12(salt round) to the 2nd argument
  // We do asyn for this - This is because the hashing done by bcrypt is CPU intensive, so the sync version will block the event loop and prevent your application from servicing any other inbound requests or events.
  this.password = await bcrypt.hash(this.password, 12); // encrypt password

  this.passwordConfirm = undefined; // We do not need this field
  next();
});

// Render only active status is true (active:false meands user deleted account)
// regex - All find methods start with "find" (findOne etc)
userSchema.pre(/^find/, function(next) {
  // This points to the current qury
  this.find({ active: { $ne: false } });
  next();
});
// Login -check if user's input password is correct
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(this.passwordChangedAt, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

//bcrypt could be string but this ctypto is temporaly, just token - we do not store in db
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  //10min 60 secnds 1000mil seconds
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
