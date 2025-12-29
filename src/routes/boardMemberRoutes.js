const express = require("express");
const router = express.Router({ mergeParams: true });

const boardRoles = require("../enums/boardRoles");
const boardsController = require("../controllers/boardsController");
const boardMemberController = require("../controllers/boardMemberController");

router.get(
  "/",
  boardsController.restrictBoardTo(boardRoles.OWNER, boardRoles.ADMIN),
  boardMemberController.getBoardMembers
);

router
  .route("/:userId")
  .post(
    boardsController.restrictBoardTo(boardRoles.OWNER),
    boardMemberController.assignUserToBoard
  )
  .delete(
    boardsController.restrictBoardTo(boardRoles.OWNER),
    boardMemberController.removeBoardMember
  )
  .patch(
    boardsController.restrictBoardTo(boardRoles.OWNER),
    boardMemberController.convertViewerToAdmin
  );

module.exports = router;
