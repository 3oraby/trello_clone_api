const express = require("express");
const router = express.Router({ mergeParams: true });

const boardRoles = require("../enums/boardRoles");
const authController = require("../controllers/authController");
const boardsController = require("../controllers/boardsController");
const boardMemberController = require("../controllers/boardMemberController");

router.use(authController.protect, boardsController.requireBoardAccess);
router.get(
  "/",
  boardsController.restrictBoardTo(boardRoles.OWNER, boardRoles.ADMIN),
  boardMemberController.getBoardMembers
);

router.post(
  "/:userId",
  boardsController.restrictBoardTo(boardRoles.OWNER),
  boardMemberController.assignUserToBoard
);

router.delete(
  "/:userId",
  boardsController.restrictBoardTo(boardRoles.OWNER),
  boardMemberController.removeBoardMember
);

router.patch(
  "/:userId/promote",
  boardsController.restrictBoardTo(boardRoles.OWNER),
  boardMemberController.convertMemberToAdmin
);

router.patch(
  "/:userId/demote",
  boardsController.restrictBoardTo(boardRoles.OWNER),
  boardMemberController.convertAdminToMember
);

module.exports = router;
