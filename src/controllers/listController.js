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

  const lastList = await List.findOne({ boardId: boardId })
    .sort("-position")
    .select("position");

  req.body.position = lastList ? lastList.position + 1000 : 1000;

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
  const { prevListId, nextListId } = req.body;

  const list = req.list;

  let newPosition;

  if (!prevListId && nextListId) {
    const nextList = await List.findById(nextListId);
    newPosition = nextList.position / 2;
  } else if (prevListId && !nextListId) {
    const prevList = await List.findById(prevListId);
    newPosition = prevList.position + 1000;
  } else if (prevListId && nextListId) {
    const prevList = await List.findById(prevListId);
    const nextList = await List.findById(nextListId);
    newPosition = (prevList.position + nextList.position) / 2;
  } else {
    return next(new AppError("Invalid move operation", HttpStatus.BadRequest));
  }

  list.position = newPosition;
  await list.save();

  res.status(200).json({
    status: "success",
    list,
  });
});

exports.normalizeLists = catchAsync(async (req, res, next) => {
  const lists = await List.find({ boardId: req.params.boardId }).sort(
    "position"
  );

  let position = 1000;

  for (const list of lists) {
    list.position = position;
    position += 1000;
    await list.save();
  }

  res.status(200).json({
    status: "success",
    message: "Lists normalized successfully",
  });
});
