const mongoose = require("mongoose");
const argon2 = require("argon2");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: this,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: this,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: this,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      this.password = await argon2.hash(this.password);
    } catch (error) {
      console.log("error at user model hasing passsword");
      return next(error);
    }
  }
});

userSchema.methods.comparePassword = async function (cantidatePassword) {
  try {
    return await argon2.verify(this.password, cantidatePassword);
  } catch (error) {
    throw error;
  }
};

userSchema.index({ username: "text" });

module.exports = mongoose.model("User", userSchema);
