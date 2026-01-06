const mongoose = require("mongoose");
const checklistItemSchema = require("./checklistItemSchema");

const checklistSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: true,
      index: true,
    },
    items: [checklistItemSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("Checklist", checklistSchema);
