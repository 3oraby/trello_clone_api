const mongoose = require("mongoose");
const boardRoles = require("../enums/boardRoles");

const boardMemberSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: {
        values: [boardRoles.OWNER, boardRoles.ADMIN, boardRoles.MEMBER],
        message: `Role must be ${boardRoles.OWNER} or ${boardRoles.ADMIN} or ${boardRoles.MEMBER}`,
      },
      default: boardRoles.MEMBER,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

boardMemberSchema.index({ userId: 1, boardId: 1 }, { unique: true });

module.exports = mongoose.model("BoardMember", boardMemberSchema);
