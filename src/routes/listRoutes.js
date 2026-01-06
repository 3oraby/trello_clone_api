const express = require("express");
const router = express.Router({ mergeParams: true });
const listController = require("../controllers/listController");
const authController = require("../controllers/authController");
const boardRoles = require("../enums/boardRoles");
const boardsController = require("../controllers/boardsController");
const cardRoutes = require("./cardRoutes");

router.use("/:id/cards", cardRoutes);

router.use(authController.protect);

router
  .route("/")
  .get(boardsController.requireBoardAccess, listController.getAllLists)
  .post(boardsController.requireBoardAccess, listController.createList);

router
  .route("/:id")
  .get(listController.requireListAccess, listController.getList)
  .patch(listController.requireListAccess, listController.updateList)
  .delete(
    listController.requireListAccess,
    boardsController.restrictBoardTo(boardRoles.OWNER, boardRoles.ADMIN),
    listController.deleteList
  );

router.patch(
  "/:id/move",
  listController.requireListAccess,
  listController.moveList
);

module.exports = router;
