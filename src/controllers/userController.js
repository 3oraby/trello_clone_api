const handlerFactory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsc");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const AppError = require("../utils/appError");

exports.getAllUsers = handlerFactory.getAll(User);
exports.createUser = handlerFactory.createOne(User);
exports.getUser = handlerFactory.getOne(User);

exports.checkID = (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return next(new AppError("No user found with that ID", 404));
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid user ID", 400));
  }

  next();
};

exports.updateUser = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates", 400));
  }

  if (req.body.role) {
    return next(new AppError("This route is not for role updates", 400));
  }

  if (req.body.isVerified) {
    return next(new AppError("This route is not for isVerified updates", 400));
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: user,
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, { active: false });

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
