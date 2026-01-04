const express = require("express");

const router = express.Router();
const boardsController = require("../controllers/boardsController");

const authController = require("../controllers/authController");
const boardRoles = require("../enums/boardRoles");
const boardMemberRoutes = require("./boardMemberRoutes");
const listRoutes = require("./listRoutes");

router.use("/:boardId/members", boardMemberRoutes);
router.use("/:boardId/lists", listRoutes);

router.use(authController.protect);

router.get(
  "/getAll",
  authController.restrictTo("admin"),
  boardsController.getAllBoards
);

router
  .route("/")
  .get(boardsController.filterByUser, boardsController.getMyBoards)
  .post(boardsController.setBoardUserIds, boardsController.createBoard);

router.post("/:id/archive", boardsController.archiveBoard);

router.delete("/:id/unarchive", boardsController.unarchiveBoard);

router.get("/archived", boardsController.getArchivedBoards);

router
  .route("/:id")
  .get(boardsController.getBoard)
  .patch(
    boardsController.requireBoardAccess,
    boardsController.restrictBoardTo(boardRoles.OWNER, boardRoles.ADMIN),
    boardsController.updateBoard
  )
  .delete(
    boardsController.requireBoardAccess,
    boardsController.restrictBoardTo(boardRoles.OWNER, boardRoles.ADMIN),
    boardsController.deleteBoard
  );

module.exports = router;
