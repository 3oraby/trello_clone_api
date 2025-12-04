const handlerFactory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsc");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const AppError = require("../utils/appError");

exports.getAllUsers = handlerFactory.getAll(User);
exports.createUser = handlerFactory.createOne(User);
exports.getUser = handlerFactory.getOne(User);
exports.updateUser = handlerFactory.updateOne(User);

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
