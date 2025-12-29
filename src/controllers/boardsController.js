const handlerFactory = require("./handlerFactory");
const Board = require("../models/boardModel");
const BoardMember = require("../models/boardMemberModel");
const AppError = require("../utils/appError");
const boardRoles = require("../enums/boardRoles");
const catchAsync = require("../utils/catchAsc");
const HttpStatus = require("../enums/httpStatus");

exports.getAllBoards = handlerFactory.getAll(Board);
exports.getBoard = handlerFactory.getOne(Board);
exports.updateBoard = handlerFactory.updateOne(Board);
exports.deleteBoard = handlerFactory.deleteOne(Board);
exports.getMyBoards = handlerFactory.getAll(Board);

exports.setBoardUserIds = (req, res, next) => {
  if (!req.body.ownerId) req.body.ownerId = req.user.id;
  next();
};

exports.filterByUser = (req, res, next) => {
  req.filter = { ownerId: req.user.id };
  next();
};

exports.restrictBoardTo = (...roles) => {
  return async (req, res, next) => {
    const boardId = req.params.id || req.params.boardId;
    const userId = req.user.id;
    console.log(boardId, userId);

    const board = await Board.findById(boardId);
    if (!board) return next(new AppError("Board not found", 404));

    let boardRole;
    let membership;

    if (board.ownerId === userId) {
      boardRole = boardRoles.ADMIN;
    } else {
      membership = await BoardMember.findOne({ boardId, userId });
      if (!membership) {
        return next(
          new AppError("You do not have permission to access this board", 403)
        );
      }
      boardRole = membership.role;
    }

    if (!roles.includes(boardRole)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    req.board = board;
    req.boardMembership = membership;

    next();
  };
};

exports.createBoard = catchAsync(async (req, res, next) => {
  if (!req.body.ownerId) req.body.ownerId = req.user.id;

  const board = await Board.create(req.body);

  await BoardMember.create({
    boardId: board._id,
    userId: req.user.id,
    role: boardRoles.OWNER,
  });

  res.status(201).json({
    status: "success",
    board,
  });
});
