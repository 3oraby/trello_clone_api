const mongoose = require("mongoose");

const checklistItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    position: {
      type: Number,
      required: true,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedAt: Date,
  },
  { _id: true }
);

module.exports = checklistItemSchema;
