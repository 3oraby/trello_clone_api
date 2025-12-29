const express = require("express");

const router = express.Router();
const boardsController = require("../controllers/boardsController");

const { protect, restrictTo } = require("../controllers/authController");
const boardRoles = require("../enums/boardRoles");
const boardMemberRoutes = require("./boardMemberRoutes");

router.use(protect);

router.get("/getAll", restrictTo("admin"), boardsController.getAllBoards);

router
  .route("/")
  .get(boardsController.filterByUser, boardsController.getMyBoards)
  .post(boardsController.setBoardUserIds, boardsController.createBoard);

// use boardMemberRoutes "nested routes"
router.use("/:boardId/members", boardMemberRoutes);

router.post("/:id/archive", boardsController.archiveBoard);

router.delete("/:id/unarchive", boardsController.unarchiveBoard);

router.get("/archived", boardsController.getArchivedBoards);

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
