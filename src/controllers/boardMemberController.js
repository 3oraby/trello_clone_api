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
        HttpStatus.BadRequest
      )
    );

  const board = await Board.findById(boardId);
  if (!board) return next(new AppError("Board not found", HttpStatus.NotFound));

  const exists = await BoardMember.findOne({ boardId, userId });
  if (exists) {
    return next(
      new AppError("User already member of this board", HttpStatus.BadRequest)
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

exports.removeBoardMember = catchAsync(async (req, res, next) => {
  const boardId = req.params.boardId;
  const userId = req.params.userId;

  const board = await Board.findById(boardId);
  if (!board) return next(new AppError("Board not found", HttpStatus.NotFound));

  const membership = await BoardMember.findOneAndDelete({
    boardId,
    userId,
  });

  if (!membership)
    return next(
      new AppError("User not found in this board", HttpStatus.NotFound)
    );

  res.status(200).json({
    status: "success",
    message: "User removed from board",
  });
});

exports.convertMemberToAdmin = catchAsync(async (req, res, next) => {
  const { boardId, userId } = req.params;

  const board = await Board.findById(boardId);
  if (!board) {
    return next(new AppError("Board not found", HttpStatus.NotFound));
  }

  const membership = await BoardMember.findOne({ boardId, userId });
  if (!membership) {
    return next(
      new AppError("User is not a member of this board", HttpStatus.NotFound)
    );
  }

  if (membership.role === boardRoles.OWNER) {
    return next(
      new AppError(
        "You cannot change the board owner role",
        HttpStatus.Forbidden
      )
    );
  }

  if (membership.role === boardRoles.ADMIN) {
    return next(
      new AppError(
        "This route is not responsible for changing admin roles",
        HttpStatus.BadRequest
      )
    );
  }

  membership.role = boardRoles.ADMIN;
  await membership.save();

  res.status(200).json({
    status: "success",
    membership,
  });
});

exports.convertAdminToMember = catchAsync(async (req, res, next) => {
  const boardId = req.params.boardId;
  const userId = req.params.userId;

  const board = await Board.findById(boardId);
  if (!board) {
    return next(new AppError("Board not found", HttpStatus.NotFound));
  }

  const membership = await BoardMember.findOne({ boardId, userId });

  if (!membership) {
    return next(new AppError("User is not a member of this board", HttpStatus.NotFound));
  }

  if (membership.role === boardRoles.MEMBER) {
    return next(new AppError("User is already a member", HttpStatus.BadRequest));
  }

  if (membership.role === boardRoles.OWNER) {
    return next(new AppError("Owner role cannot be changed", HttpStatus.Forbidden));
  }

  membership.role = boardRoles.MEMBER;
  await membership.save();

  res.status(200).json({
    status: "success",
    membership,
  });
});
