const mongoose = require("mongoose");

const { ObjectId } = require("mongodb");

const PlanningModel = mongoose.Schema({
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
  date: {
    type: Date,
    required: true,
  },
  class: {
    type: ObjectId,
    required: true,
    trim: true,
  },
  plan: {
    morning: {
      type: ObjectId,
    },
    afternoon: {
      type: ObjectId,
    },
  },
});

module.exports = planning = mongoose.model("plannings", PlanningModel);
