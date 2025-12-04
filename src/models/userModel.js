const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [40, "A user name must have less or equal then 40 characters"],
    minlength: [2, "A user name must have more or equal then 2 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  password: {
    type: String,
    select: false,
    required: [true, "Password is required"],
    validate: [validator.isStrongPassword, "Please provide a strong password"],
  },
  passwordConfirm: {
    type: String,
    required: [true, "Password confirm is required"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Password confirm is not the same as password",
    },
  },
  role: {
    type: String,
    enum: { values: ["user", "admin"], message: "Role must be user or admin" },
    default: "user",
  },
  active: {
    type: Boolean,
    default: true,
  },
  photo: {
    type: String,
  },
});

// hash password before save user
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);

  // remove passwordConfirm before save user
  this.passwordConfirm = undefined;
});

// remove not active users before get users
userSchema.pre(/^find/, function () {
  this.find({ active: true });
});

// check password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  if (!candidatePassword || !userPassword) return false;
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model("User", userSchema);
