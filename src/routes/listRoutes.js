const express = require("express");
const router = express.Router({ mergeParams: true });
const listController = require("../controllers/listController");
const authController = require("../controllers/authController");
const boardRoles = require("../enums/boardRoles");
const boardsController = require("../controllers/boardsController");

router.use(authController.protect);

router
  .route("/")
  .get(boardsController.requireBoardAccess, listController.getAllLists)
  .post(boardsController.requireBoardAccess, listController.createList);

router
  .route("/:id")
  .get(listController.getList)
  .patch(listController.requireBoardAccess, listController.updateList)
  .delete(
    listController.requireBoardAccess,
    boardsController.restrictBoardTo(boardRoles.OWNER, boardRoles.ADMIN),
    listController.deleteList
  );

router.post(
  "/normalize",
  boardsController.requireBoardAccess,
  boardsController.restrictBoardTo(boardRoles.OWNER, boardRoles.ADMIN),
  listController.normalizeLists
);

router.patch(
  "/:id/move",
  listController.requireBoardAccess,
  listController.moveList
);

module.exports = router;
