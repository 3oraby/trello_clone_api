const handlerFactory = require("./handlerFactory");
const Board = require("../models/boardModel");
const BoardMember = require("../models/boardMemberModel");
const AppError = require("../utils/appError");
const boardRoles = require("../enums/boardRoles");
const catchAsync = require("../utils/catchAsc");
const HttpStatus = require("../enums/httpStatus");

const getBoardMembership = async (boardId, userId) => {
  const membership = await BoardMember.findOne({ boardId, userId }).populate(
    "boardId"
  );
  if (!membership) {
    throw new AppError("Board membership not found", HttpStatus.NotFound);
  }
  return membership;
};

const toggleArchiveStatus = async (boardId, userId, archive = true) => {
  const membership = await getBoardMembership(boardId, userId);

  if (membership.isArchived === archive) {
    throw new AppError(
      archive ? "Board already archived" : "Board is not archived",
      HttpStatus.BadRequest
    );
  }

  membership.isArchived = archive;
  await membership.save();
  return membership;
};

exports.getAllBoards = handlerFactory.getAll(Board);
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

exports.restrictBoardTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    const boardId = req.params.id || req.params.boardId;
    const userId = req.user.id;

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
  });
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

exports.archiveBoard = catchAsync(async (req, res, next) => {
  const membership = await toggleArchiveStatus(
    req.params.id,
    req.user.id,
    true
  );
  res.status(200).json({
    status: "success",
    message: "Board archived successfully",
    board: membership.boardId,
  });
});

exports.unarchiveBoard = catchAsync(async (req, res, next) => {
  const membership = await toggleArchiveStatus(
    req.params.id,
    req.user.id,
    false
  );
  res.status(200).json({
    status: "success",
    message: "Board unarchived successfully",
    board: membership.boardId,
  });
});

exports.getMyBoards = catchAsync(async (req, res, next) => {
  const memberships = await BoardMember.find({
    userId: req.user.id,
    isArchived: false,
  }).populate("boardId");

  const boards = memberships.map((m) => m.boardId).filter(Boolean);

  res.status(200).json({
    status: "success",
    results: boards.length,
    boards,
  });
});

exports.getArchivedBoards = catchAsync(async (req, res, next) => {
  const memberships = await BoardMember.find({
    userId: req.user.id,
    isArchived: true,
  }).populate("boardId");

  const boards = memberships.map((m) => m.boardId).filter(Boolean);

  res.status(200).json({
    status: "success",
    results: boards.length,
    boards,
  });
});
