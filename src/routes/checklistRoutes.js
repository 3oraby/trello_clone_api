const express = require("express");
const router = express.Router({ mergeParams: true });
const cardController = require("../controllers/cardController");
const authController = require("../controllers/authController");
const checklistController = require("../controllers/checklistController");
const checklistItemRoutes = require("./checklistItemRoutes");

router.use("/:checklistId/checklistItems", checklistItemRoutes);

router.use(authController.protect);

router
  .route("/")
  .get(cardController.requireCardAccess, checklistController.getAllChecklists)
  .post(cardController.requireCardAccess, checklistController.createChecklist);

router
  .route("/:id")
  .get(
    checklistController.requireChecklistAccess,
    checklistController.getChecklist
  )
  .patch(
    checklistController.requireChecklistAccess,
    checklistController.updateChecklist
  )
  .delete(
    checklistController.requireChecklistAccess,
    checklistController.deleteChecklist
  );

module.exports = router;
