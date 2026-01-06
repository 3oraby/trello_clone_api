const catchAsync = require("../utils/catchAsc");
const AppError = require("../utils/appError");
const HttpStatus = require("../enums/httpStatus");
const Checklist = require("../models/checklistModel");
const Card = require("../models/cardModel");
const List = require("../models/listModel");
const Board = require("../models/boardModel");
const BoardMember = require("../models/boardMemberModel");
const handlerFactory = require("./handlerFactory");

exports.requireChecklistAccess = catchAsync(async (req, res, next) => {
  const checklistId = req.params.checklistId;

  const checklist = await Checklist.findById(checklistId);
  if (!checklist)
    return next(new AppError("Checklist not found", HttpStatus.NotFound));

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

  next();
});

exports.getChecklist = handlerFactory.getOne(Checklist);
exports.updateChecklist = handlerFactory.updateOne(Checklist);
exports.deleteChecklist = handlerFactory.deleteOne(Checklist);

exports.createChecklist = catchAsync(async (req, res, next) => {
  const { title } = req.body;
  const cardId = req.params.id;

  if (!title)
    return next(
      new AppError("Checklist title is required", HttpStatus.BadRequest)
    );

  const checklist = await Checklist.create({
    title,
    cardId,
    createdBy: req.user.id,
    items: [],
  });

  res.status(201).json({
    status: "success",
    checklist,
  });
});

exports.getAllChecklists = catchAsync(async (req, res, next) => {
  const cardId = req.params.id;

  const checklists = await Checklist.find({ cardId })
    .sort("createdAt")
    .populate("items");

  res.status(200).json({
    status: "success",
    results: checklists.length,
    checklists,
  });
});
