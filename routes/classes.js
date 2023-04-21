const express = require("express");
const router = express.Router();
const objectId = require("mongoose").Types.ObjectId;

const bcrypt = require("bcryptjs");
const saltRounds = 10;

const ClassModel = require("../models/Class");
const PlanningModel = require("../models/Planning");

let slug = require("slug");
const nodemailer = require("nodemailer");
const { json } = require("express");

const { expressjwt: jwt } = require("express-jwt");
const jwtOptions = { secret: process.env.jwt_SECRET, algorithms: ["HS256"] };

router.post("/", jwt(jwtOptions), async function (req, res) {
  if (!req.fields.name) {
    res.status(400).send("Aucun nom spécifié");
  }
  req.fields.slug = slug(req.fields.name);
  console.log(req.fields);
  const newClass = new ClassModel(req.fields);
  newClass.save().then((err, docs) => {
    if (!err) res.send(docs);
    else res.status(400).send(err);
  });
});
router.get("/byProf/:id", jwt(jwtOptions), async function (req, res) {
  try {
    await ClassModel.find({ prof: req.params.id });
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
