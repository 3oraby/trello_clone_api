const List = require("../models/listModel");
const Board = require("../models/boardModel");
const handlerFactory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsc");
const AppError = require("../utils/appError");
const HttpStatus = require("../enums/httpStatus");
const boardRoles = require("../enums/boardRoles");
const BoardMember = require("../models/boardMemberModel");

exports.requireBoardAccess = catchAsync(async (req, res, next) => {
  const listId = req.params.id;

  if (!listId) {
    return next(new AppError("List id is required", HttpStatus.BadRequest));
  }

  const list = await List.findById(listId);
  if (!list) {
    return next(new AppError("List not found", HttpStatus.NotFound));
  }

  const membership = await BoardMember.findOne({
    boardId: list.boardId,
    userId: req.user.id,
  });

  if (!membership) {
    return next(
      new AppError("You are not a member of the board", HttpStatus.Forbidden)
    );
  }

  req.list = list;
  req.boardId = list.boardId;
  req.boardMembership = membership;

  next();
});

exports.getList = handlerFactory.getOne(List);
exports.updateList = handlerFactory.updateOne(List);
exports.deleteList = handlerFactory.deleteOne(List);

exports.getAllLists = catchAsync(async (req, res, next) => {
  const boardId = req.params.boardId;

  const lists = await List.find({ boardId: boardId }).sort("position");

  res.status(200).json({
    status: "success",
    results: lists.length,
    lists,
  });
});

exports.createList = catchAsync(async (req, res, next) => {
  const boardId = req.params.boardId;
  const createdBy = req.user.id;
  const board = await Board.findById(boardId);
  if (!board) {
    return next(new AppError("Board not found", HttpStatus.NotFound));
  }

  const listsCount = await List.countDocuments({ boardId });

  req.body.position = listsCount;

  const list = await List.create({
    ...req.body,
    createdBy,
    boardId,
  });

  res.status(201).json({
    status: "success",
    list,
  });
});

exports.moveList = catchAsync(async (req, res, next) => {
  const { newPosition } = req.body;
  const listId = req.params.id;

  if (
    typeof newPosition !== "number" ||
    isNaN(newPosition) ||
    newPosition < 0
  ) {
    return next(
      new AppError(
        "Invalid newPosition: must be a non-negative number",
        HttpStatus.BadRequest
      )
    );
  }

  const list = await List.findById(listId);
  if (!list) return next(new AppError("List not found", HttpStatus.NotFound));

  const boardLists = await List.find({ boardId: list.boardId }).sort(
    "position"
  );

  if (newPosition >= boardLists.length) {
    return next(
      new AppError(
        `Invalid newPosition: must be less than ${boardLists.length}`,
        HttpStatus.BadRequest
      )
    );
  }

  const oldIndex = boardLists.findIndex((l) => l._id.equals(list._id));
  if (oldIndex === -1)
    return next(new AppError("List not found in board", HttpStatus.NotFound));

  if (newPosition === oldIndex) {
    return next(
      new AppError("List is already in this position", HttpStatus.BadRequest)
    );
  }

  boardLists.splice(oldIndex, 1);
  boardLists.splice(newPosition, 0, list);

  const bulkOps = boardLists.map((l, index) => ({
    updateOne: {
      filter: { _id: l._id },
      update: { position: index },
    },
  }));

  await List.bulkWrite(bulkOps);

  res
    .status(200)
    .json({ status: "success", message: "List moved successfully" });
});
