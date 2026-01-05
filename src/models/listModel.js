const mongoose = require("mongoose");

const listSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "List title is required"],
      trim: true,
      minlength: [2, "List title must be at least 2 characters"],
      maxlength: [50, "List title must be at most 50 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description must be at most 200 characters"],
    },
    position: {
      type: Number,
      required: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
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

listSchema.index({ boardId: 1, position: 1 });

module.exports = mongoose.model("List", listSchema);
