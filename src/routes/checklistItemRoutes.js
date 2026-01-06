const express = require("express");
const router = express.Router({ mergeParams: true });
const authController = require("../controllers/authController");
const checklistController = require("../controllers/checklistController");
const checklistItemController = require("../controllers/checklistItemController");

router.use(authController.protect);

router
  .route("/")
  .post(checklistController.requireChecklistAccess, checklistItemController.createChecklistItem);

router
  .route("/:id")
  .patch(
    checklistItemController.requireChecklistItemAccess,
    checklistItemController.updateChecklistItem
  )
  .delete(
    checklistItemController.requireChecklistItemAccess,
    checklistItemController.deleteChecklistItem
  );

router.patch(
  "/:id/move",
  checklistItemController.requireChecklistItemAccess,
  checklistItemController.moveChecklistItem
);

router.patch(
  "/:id/toggleCompletion",
  checklistItemController.requireChecklistItemAccess,
  checklistItemController.toggleChecklistItem
);

module.exports = router;
