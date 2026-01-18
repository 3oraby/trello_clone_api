const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const generateOTP = require("../utils/generateOtp");
const Email = require("../utils/email");

const userSchema = new mongoose.Schema(
  {
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
      // validate: [validator.isStrongPassword, "Please provide a strong password"],
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
      enum: {
        values: ["user", "admin"],
        message: "Role must be user or admin",
      },
      default: "user",
    },
    active: {
      type: Boolean,
      default: true,
    },
    photo: {
      type: String,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailOTP: String,
    emailOTPExpires: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        return {
          id: ret._id,
          name: ret.name,
          email: ret.email,
          role: ret.role,
          isVerified: ret.isVerified,
          photo: ret.photo || null,
          createdAt: ret.createdAt,
          updatedAt: ret.updatedAt,
        };
      },
    },
  },
);

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

userSchema.pre(/^findOne/, function () {
  this.find({ active: true });
});

// update passwordChangedAt when password is changed
userSchema.pre("save", function () {
  if (!this.isModified("password") || this.isNew) return;

  // -1000 to ensure the token is created after the password has been changed
  this.passwordChangedAt = Date.now() - 1000;
});

// check password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  if (!candidatePassword || !userPassword) return false;
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// check if password is changed after token is created
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.sendVerificationOTP = async function (req) {
  const otp = generateOTP();
  const otpHashed = crypto.createHash("sha256").update(otp).digest("hex");
  this.emailOTP = otpHashed;
  this.emailOTPExpires = Date.now() + process.env.OTP_EXPIRES_IN * 60 * 1000;
  await this.save({ validateBeforeSave: false });
  new Email(this, req).sendVerificationOTP(otp);
};

module.exports = mongoose.model("User", userSchema);
