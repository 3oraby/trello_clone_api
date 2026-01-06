const catchAsync = require("../utils/catchAsc");
const AppError = require("../utils/appError");
const HttpStatus = require("../enums/httpStatus");
const Checklist = require("../models/checklistModel");
const Card = require("../models/cardModel");
const List = require("../models/listModel");
const Board = require("../models/boardModel");
const BoardMember = require("../models/boardMemberModel");

exports.requireChecklistItemAccess = catchAsync(async (req, res, next) => {
  const itemId = req.params.id;

  const checklist = await Checklist.findOne({ "items._id": itemId });
  if (!checklist)
    return next(new AppError("Checklist not found", HttpStatus.NotFound));

  const item = checklist.items.id(itemId);
  if (!item)
    return next(new AppError("Checklist item not found", HttpStatus.NotFound));

  const card = await Card.findById(checklist.cardId);
  if (!card) return next(new AppError("Card not found", HttpStatus.NotFound));

  const list = await List.findById(card.listId);
  if (!list) return next(new AppError("List not found", HttpStatus.NotFound));

  const board = await Board.findById(list.boardId);
  if (!board) return next(new AppError("Board not found", HttpStatus.NotFound));

  const membership = await BoardMember.findOne({
    boardId: board._id,
    userId: req.user.id,
  });

  if (!membership)
    return next(
      new AppError("You are not a member of this board", HttpStatus.Forbidden)
    );

  req.checklist = checklist;
  req.card = card;
  req.list = list;
  req.board = board;
  req.checklistItemId = itemId;
  req.checklistItem = item;

  next();
});

exports.createChecklistItem = catchAsync(async (req, res, next) => {
  const checklist = req.checklist;
  const { title } = req.body;

  if (!title)
    return next(
      new AppError("Checklist item title is required", HttpStatus.BadRequest)
    );

  const position = checklist.items.length;
  checklist.items.push({ title, position });

  await checklist.save();
  const item = checklist.items[checklist.items.length - 1];

  res.status(201).json({
    status: "success",
    message: "Checklist item created successfully",
    item,
  });
});

exports.updateChecklistItem = catchAsync(async (req, res, next) => {
  const checklist = req.checklist;
  const item = req.checklistItem;

  if ("position" in req.body)
    return next(
      new AppError(
        "This route does not handle position updates",
        HttpStatus.BadRequest
      )
    );

  item.title = req.body.title;

  await checklist.save();

  res.status(200).json({
    status: "success",
    message: "Checklist item updated successfully",
    item,
  });
});

exports.deleteChecklistItem = catchAsync(async (req, res, next) => {
  const checklist = req.checklist;
  const itemId = req.checklistItemId;

  checklist.items.pull(itemId);

  checklist.items.forEach((i, index) => (i.position = index));
  await checklist.save();

  res.status(201).json({
    status: "success",
    message: "Checklist item deleted successfully",
  });
});

exports.moveChecklistItem = catchAsync(async (req, res, next) => {
  const { newPosition } = req.body;
  const checklist = req.checklist;
  const itemId = req.checklistItemId;

  if (typeof newPosition !== "number" || newPosition < 0)
    return next(new AppError("Invalid newPosition", HttpStatus.BadRequest));

  const items = checklist.items.sort((a, b) => a.position - b.position);

  if (newPosition >= items.length)
    return next(
      new AppError(
        `newPosition must be less than ${items.length}`,
        HttpStatus.BadRequest
      )
    );

  const oldIndex = items.findIndex((i) => i._id.equals(itemId));
  if (oldIndex === -1)
    return next(new AppError("Item not found", HttpStatus.NotFound));

  if (oldIndex === newPosition)
    return next(
      new AppError("Item already in this position", HttpStatus.BadRequest)
    );

  const item = items[oldIndex];
  items.splice(oldIndex, 1);
  items.splice(newPosition, 0, item);

  items.forEach((i, index) => (i.position = index));
  await checklist.save();

  res.status(200).json({
    status: "success",
    message: "Checklist item moved successfully to position " + newPosition,
    item: { id: item._id, position: newPosition },
  });
});

exports.toggleChecklistItem = catchAsync(async (req, res, next) => {
  const checklist = req.checklist;
  const item = req.checklistItem;

  item.isCompleted = !item.isCompleted;
  if (item.isCompleted) {
    item.completedBy = req.user.id;
    item.completedAt = new Date();
  } else {
    item.completedBy = undefined;
    item.completedAt = undefined;
  }

  await checklist.save();
  res.status(200).json({
    status: "success",
    message: "Checklist item updated successfully",
    item,
  });
});
