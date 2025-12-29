const mongoose = require("mongoose");

const BoardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [
        40,
        "A board title must have less or equal then 40 characters",
      ],
      minlength: [2, "A board title must have more or equal then 2 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [
        200,
        "A board description must have less or equal then 200 characters",
      ],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

BoardSchema.index({ title: 1, ownerId: 1 }, { unique: true });

module.exports = mongoose.model("Board", BoardSchema);
