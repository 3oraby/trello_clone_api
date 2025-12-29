const Board = require("../models/boardModel");
const BoardMember = require("../models/boardMemberModel");
const AppError = require("../utils/appError");
const boardRoles = require("../enums/boardRoles");
const catchAsync = require("../utils/catchAsc");
const HttpStatus = require("../enums/httpStatus");

exports.assignUserToBoard = catchAsync(async (req, res, next) => {
  const { boardId, userId } = req.params;

  if (req.user.id === userId)
    return next(
      new AppError(
        "You cannot assign yourself to this board",
        HttpStatus.BAD_REQUEST
      )
    );

  const board = await Board.findById(boardId);
  if (!board)
    return next(new AppError("Board not found", HttpStatus.NOT_FOUND));

  const exists = await BoardMember.findOne({ boardId, userId });
  if (exists) {
    return next(
      new AppError("User already member of this board", HttpStatus.BAD_REQUEST)
    );
  }

  const membership = await BoardMember.create({
    boardId,
    userId,
    role: boardRoles.MEMBER,
    invitedBy: req.user.id,
  });

  res.status(201).json({
    status: "success",
    membership,
  });
});

exports.getBoardMembers = catchAsync(async (req, res, next) => {
  const boardId = req.params.boardId;

  const members = await BoardMember.find({ boardId });

  res.status(200).json({
    status: "success",
    members,
  });
});

// remove user from board
exports.removeBoardMember = catchAsync(async (req, res, next) => {
  const boardId = req.params.id;
  const userId = req.body.userId;

  const board = await Board.findById(boardId);
  if (!board)
    return next(new AppError("Board not found", HttpStatus.NOT_FOUND));

  const membership = await BoardMember.findOneAndDelete({
    boardId,
    userId,
  });

  res.status(200).json({
    status: "success",
    membership,
  });
});

// convert viewer to admin
exports.convertViewerToAdmin = catchAsync(async (req, res, next) => {
  const boardId = req.params.id;
  const userId = req.body.userId;

  const board = await Board.findById(boardId);
  if (!board)
    return next(new AppError("Board not found", HttpStatus.NOT_FOUND));

  const membership = await BoardMember.findOneAndUpdate(
    { boardId, userId },
    { role: boardRoles.ADMIN }
  );

  res.status(200).json({
    status: "success",
    membership,
  });
});
