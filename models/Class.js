const mongoose = require("mongoose");

const { ObjectId } = require("mongodb");

const ClassModel = mongoose.Schema({
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
  prof: {
    type: ObjectId,
  },
});

module.exports = classItem = mongoose.model("classes", ClassModel);
