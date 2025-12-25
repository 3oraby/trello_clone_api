const handlerFactory = require("./handlerFactory");
const Board = require("../models/boardModel");

exports.getAllBoards = handlerFactory.getAll(Board);
exports.createBoard = handlerFactory.createOne(Board);
exports.getBoard = handlerFactory.getOne(Board);
exports.updateBoard = handlerFactory.updateOne(Board);
exports.deleteBoard = handlerFactory.deleteOne(Board);

exports.setBoardUserIds = (req, res, next) => {
  if (!req.body.ownerId) req.body.ownerId = req.user.id;
  next();
};

exports.filterByUser = (req, res, next) => {
  req.filter = { ownerId: req.user.id };
  next();
};
