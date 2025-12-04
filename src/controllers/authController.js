const handlerFactory = require("../controllers/handlerFactory");
const catchAsc = require("../utils/catchAsc");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");

const User = require("../models/userModel");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res, message) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    message: message,
    token,
    data: user,
  });
};

exports.protect = catchAsc(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  const decoded = await jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);

  console.log(user);
  if (!user) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }
  req.user = user;
  next();
});

exports.login = catchAsc(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // select +password to compare password
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  if (!user.active) {
    return next(new AppError("User is not active", 401));
  }

  createSendToken(user, 200, res, "User logged in successfully");
});

exports.signup = catchAsc(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    age: req.body.age,
    role: req.body.role,
  });

  createSendToken(newUser, 201, res, "User created successfully");
});

exports.updatePassword = catchAsc(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;
  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    return next(
      new AppError(
        "Please provide currentPassword , newPassword and newPasswordConfirm",
        400
      )
    );
  }

  const user = await User.findById(req.user.id).select("+password");

  if (!user || !(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError("current password is not correct", 401));
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;

  // to validate password and passwordConfirm
  await user.save();

  createSendToken(user, 200, res, "Password updated successfully");
});
