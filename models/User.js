const mongoose = require("mongoose");

const { ObjectId } = require("mongodb");

const UserModel = mongoose.Schema({
  createdAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
  updatedAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    default: "eleve",
  },
  class: {
    type: ObjectId,
  },
  resetPasswordToken: {
    type: String,
    default: "",
  },
  confirmationToken: {
    type: String,
    default: "",
  },
  confirmed: {
    type: Boolean,
    required: true,
    default: false,
  },
  banned: {
    type: Boolean,
    required: true,
    default: false,
  },
});

UserModel.statics.isEmailTaken = async function (email) {
  return await this.findOne({ email: email.trim() });
};

module.exports = user = mongoose.model("users", UserModel);
