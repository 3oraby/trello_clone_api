const express = require("express");
const router = express.Router();
const {
  login,
  signup,
  updatePassword,
} = require("../controllers/authController");

const authController = require("../controllers/authController");

router.post("/login", login);
router.post("/signup", signup);
router.patch("/updatePassword", authController.protect, updatePassword);

module.exports = router;
