const express = require("express");

const router = express.Router();
const boardsController = require("../controllers/boardsController");

const { protect, restrictTo } = require("../controllers/authController");

router.use(protect);
router
  .route("/")
  .get(boardsController.filterByUser, boardsController.getAllBoards)
  .post(boardsController.setBoardUserIds, boardsController.createBoard);
router
  .route("/:id")
  .get(boardsController.getBoard)
  .patch(restrictTo("admin"), boardsController.updateBoard)
  .delete(restrictTo("admin"), boardsController.deleteBoard);

module.exports = router;
