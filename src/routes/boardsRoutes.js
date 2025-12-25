const express = require("express");

const router = express.Router();
const boardsController = require("../controllers/boardsController");

const { protect, restrictTo } = require("../controllers/authController");

router.get("/getAll", boardsController.getAllBoards);

router.use(protect);
router
  .route("/")
  .get(boardsController.filterByUser, boardsController.getMyBoards)
  .post(boardsController.setBoardUserIds, boardsController.createBoard);
router
  .route("/:id")
  .get(boardsController.getBoard)
  .patch(boardsController.updateBoard)
  .delete(boardsController.deleteBoard);

module.exports = router;
