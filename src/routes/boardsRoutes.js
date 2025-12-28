const express = require("express");

const router = express.Router();
const boardsController = require("../controllers/boardsController");

const { protect, restrictTo } = require("../controllers/authController");
const boardRoles = require("../enums/boardRoles");

router.use(protect);
router.get("/getAll", restrictTo("admin"), boardsController.getAllBoards);

router
  .route("/")
  .get(boardsController.filterByUser, boardsController.getMyBoards)
  .post(boardsController.setBoardUserIds, boardsController.createBoard);
router
  .route("/:id")
  .get(boardsController.getBoard)
  .patch(
    boardsController.restrictBoardTo(boardRoles.OWNER, boardRoles.ADMIN),
    boardsController.updateBoard
  )
  .delete(
    boardsController.restrictBoardTo(boardRoles.OWNER, boardRoles.ADMIN),
    boardsController.deleteBoard
  );

module.exports = router;
