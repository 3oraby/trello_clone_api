const Card = require("../models/cardModel");
const List = require("../models/listModel");
const Board = require("../models/boardModel");
const handlerFactory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsc");
const AppError = require("../utils/appError");
const HttpStatus = require("../enums/httpStatus");
const BoardMember = require("../models/boardMemberModel");

exports.requireCardAccess = catchAsync(async (req, res, next) => {
  const cardId = req.params.id;

  if (!cardId) {
    return next(new AppError("Card id is required", HttpStatus.BadRequest));
  }

  const card = await Card.findById(cardId);
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

  req.card = card;
  req.list = list;
  req.board = board;
  req.boardMembership = membership;

  next();
});

exports.getCard = handlerFactory.getOne(Card);
exports.updateCard = handlerFactory.updateOne(Card);
exports.deleteCard = handlerFactory.deleteOne(Card);

exports.getAllCards = catchAsync(async (req, res, next) => {
  const listId = req.params.id;

  const cards = await Card.find({ listId }).sort("position");

  res.status(200).json({
    status: "success",
    results: cards.length,
    cards,
  });
});

exports.createCard = catchAsync(async (req, res, next) => {
  const listId = req.params.id;
  const createdBy = req.user.id;

  const cardsCount = await Card.countDocuments({ listId });

  req.body.position = cardsCount;

  const card = await Card.create({
    ...req.body,
    createdBy,
    listId,
  });

  res.status(201).json({
    status: "success",
    card,
  });
});

exports.moveCard = catchAsync(async (req, res, next) => {
  const { newPosition } = req.body;
  const cardId = req.params.id;
  const sourceCard = req.card;

  if (typeof newPosition !== "number" || isNaN(newPosition) || newPosition < 0)
    return next(
      new AppError(
        "Invalid newPosition: must be a non-negative number",
        HttpStatus.BadRequest
      )
    );

  const cards = await Card.find({ listId: sourceCard.listId }).sort("position");

  if (newPosition >= cards.length)
    return next(
      new AppError(
        `Invalid newPosition: must be less than ${cards.length}`,
        HttpStatus.BadRequest
      )
    );

  const oldIndex = cards.findIndex((c) => c._id.equals(cardId));
  if (oldIndex === -1)
    return next(new AppError("Card not found in list", HttpStatus.NotFound));

  if (newPosition === oldIndex)
    return next(
      new AppError("Card is already in this position", HttpStatus.BadRequest)
    );

  const card = cards[oldIndex];

  cards.splice(oldIndex, 1);
  cards.splice(newPosition, 0, card);

  const bulkOps = cards.map((c, index) => ({
    updateOne: {
      filter: { _id: c._id },
      update: { position: index },
    },
  }));

  await Card.bulkWrite(bulkOps);

  const newCardPosition = cards.findIndex((c) => c._id.equals(cardId));

  res.status(200).json({
    status: "success",
    message: "Card moved successfully",
    card: { id: card._id, position: newCardPosition },
  });
});

exports.toggleCardCompletion = catchAsync(async (req, res, next) => {
  const card = req.card;

  card.isCompleted = !card.isCompleted;
  await card.save();

  res.status(200).json({
    status: "success",
    card: {
      id: card._id,
      isCompleted: card.isCompleted,
    },
  });
});
