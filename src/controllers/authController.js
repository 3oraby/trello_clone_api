const handlerFactory = require("../controllers/handlerFactory");
const catchAsc = require("../utils/catchAsc");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const { promisify } = require("util");

const User = require("../models/userModel");
const Email = require("../utils/email");
const crypto = require("crypto");
const generateAccessToken = require("../utils/generateToken");
const generateOTP = require("../utils/generateOtp");
const HttpStatus = require("../enums/httpStatus");
const bcrypt = require("bcrypt");

const createSendToken = (user, statusCode, res, message) => {
  const token = generateAccessToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
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
      new AppError(
        "You are not logged in! Please log in to get access.",
        HttpStatus.Unauthorized,
      ),
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);

  if (!user) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        HttpStatus.Unauthorized,
      ),
    );
  }

  if (user.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "User recently changed password! Please log in again.",
        HttpStatus.Unauthorized,
      ),
    );
  }

  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
};

exports.login = catchAsc(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // select +password to compare password
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(
      new AppError("Incorrect email or password", HttpStatus.Unauthorized),
    );
  }

  if (!user.active) {
    return next(new AppError("User is not active", HttpStatus.Unauthorized));
  }

  if (!user.isVerified) {
    // send verification email
    await user.sendVerificationOTP(req);
    return res.status(HttpStatus.OK).json({
      status: "success",
      message:
        "Your email is not verified. Verification OTP sent to email, please verify your email first",
    });
  }

  createSendToken(user, HttpStatus.OK, res, "User logged in successfully");
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

  await newUser.sendVerificationOTP(req);

  res.status(HttpStatus.Created).json({
    status: "success",
    message: "Verification OTP sent to email! please go and verify your email",
    data: newUser,
  });
});

exports.updatePassword = catchAsc(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;
  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    return next(
      new AppError(
        "Please provide currentPassword , newPassword and newPasswordConfirm",
        400,
      ),
    );
  }

  const user = await User.findById(req.user.id).select("+password");

  if (!user || !(await user.correctPassword(currentPassword, user.password))) {
    return next(
      new AppError("current password is not correct", HttpStatus.Unauthorized),
    );
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;

  // to validate password and passwordConfirm
  await user.save();

  createSendToken(user, HttpStatus.OK, res, "Password updated successfully");
});

exports.forgetPassword = catchAsc(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Please provide email", HttpStatus.BadRequest));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("User not found", HttpStatus.NotFound));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    "host",
  )}/resetPassword/${resetToken}`;

  try {
    await new Email(user, resetURL).sendForgetPassword();

    res.status(HttpStatus.OK).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsc(async (req, res, next) => {
  const { password, passwordConfirm } = req.body;
  if (!password || !passwordConfirm) {
    return next(
      new AppError(
        "Please provide password and passwordConfirm",
        HttpStatus.BadRequest,
      ),
    );
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new AppError("Token is invalid or has expired", HttpStatus.BadRequest),
    );
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  createSendToken(user, HttpStatus.OK, res, "Password reset successfully");
});

exports.verifyEmail = catchAsc(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return next(
      new AppError("Please provide email and otp", HttpStatus.BadRequest),
    );
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("User not found", HttpStatus.NotFound));
  }

  if (user.emailOTPExpires < Date.now()) {
    return next(new AppError("OTP expired", HttpStatus.BadRequest));
  }

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  if (hashedOtp !== user.emailOTP) {
    return next(new AppError("Invalid otp", HttpStatus.BadRequest));
  }

  user.isVerified = true;
  user.emailOTP = undefined;
  user.emailOTPExpires = undefined;

  await user.save({ validateBeforeSave: false });

  createSendToken(user, HttpStatus.OK, res, "Email verified successfully");
});
