const mongoose = require("mongoose");

const { ObjectId } = require("mongodb");

const RoomModel = mongoose.Schema({
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
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
  },
});

UserModel.statics.isEmailTaken = async function (email) {
  return await this.findOne({ email: email.trim() });
};
UserModel.statics.isUsernameTaken = async function (username) {
  return await this.findOne({ username: username.trim() });
};

module.exports = user = mongoose.model("users", UserModel);
