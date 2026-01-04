const catchAsync = require("../utils/catchAsc");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

const getModelKey = (Model, plural = false) => {
  const name = Model.modelName.toLowerCase();
  return plural ? `${name}s` : name;
};

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    const key = getModelKey(Model);

    res.status(201).json({
      status: "success",
      [key]: doc,
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    const filter =
      req.filter && typeof req.filter === "object" ? req.filter : {};

    const features = new APIFeatures(Model.find(filter), req.query);
    features.filter().sort().fields().paginate();

    const docs = await features.query;

    const key = getModelKey(Model, true);

    res.status(200).json({
      status: "success",
      results: docs.length,
      [key]: docs,
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (populateOptions) {
      query = query.populate(populateOptions);
    }

    const doc = await query;

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    const key = getModelKey(Model);

    res.status(200).json({
      status: "success",
      [key]: doc,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    const key = getModelKey(Model);

    res.status(200).json({
      status: "success",
      [key]: doc,
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      message: "Document deleted successfully",
    });
  });
