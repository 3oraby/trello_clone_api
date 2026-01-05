const express = require("express");
const router = express.Router({ mergeParams: true });
const cardController = require("../controllers/cardController");
const authController = require("../controllers/authController");
const listsController = require("../controllers/listController");

router.use(authController.protect);

router
  .route("/")
  .get(listsController.requireBoardAccess, cardController.getAllCards)
  .post(listsController.requireBoardAccess, cardController.createCard);

router
  .route("/:id")
  .get(cardController.getCard)
  .patch(cardController.requireBoardAccess, cardController.updateCard)
  .delete(cardController.requireBoardAccess, cardController.deleteCard);

router.patch(
  "/:id/move",
  cardController.requireBoardAccess,
  cardController.moveCard
);

router.patch(
  "/:id/toggleCompletion",
  cardController.requireBoardAccess,
  cardController.toggleCardCompletion
);

module.exports = router;
