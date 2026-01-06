const express = require("express");
const router = express.Router({ mergeParams: true });
const cardController = require("../controllers/cardController");
const authController = require("../controllers/authController");
const listsController = require("../controllers/listController");
const checklistRoutes = require("./checklistRoutes");

router.use("/:id/checklists", checklistRoutes);

router.use(authController.protect);

router
  .route("/")
  .get(listsController.requireListAccess, cardController.getAllCards)
  .post(listsController.requireListAccess, cardController.createCard);

router
  .route("/:id")
  .get(cardController.getCard)
  .patch(cardController.requireCardAccess, cardController.updateCard)
  .delete(cardController.requireCardAccess, cardController.deleteCard);

router.patch(
  "/:id/move",
  cardController.requireCardAccess,
  cardController.moveCard
);

router.patch(
  "/:id/toggleCompletion",
  cardController.requireCardAccess,
  cardController.toggleCardCompletion
);

module.exports = router;
