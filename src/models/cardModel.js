const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Card title is required"],
      trim: true,
      minlength: [2, "Card title must be at least 2 characters"],
      maxlength: [100, "Card title must be at most 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description must be at most 500 characters"],
    },
    position: {
      type: Number,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

cardSchema.index({ listId: 1, position: 1 });

module.exports = mongoose.model("Card", cardSchema);
