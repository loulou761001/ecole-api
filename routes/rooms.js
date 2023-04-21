const express = require("express");
const router = express.Router();
const objectId = require("mongoose").Types.ObjectId;

const bcrypt = require("bcryptjs");
const saltRounds = 10;

const UserModel = require("../models/Room");

let slug = require("slug");
const nodemailer = require("nodemailer");
const { json } = require("express");




module.exports = router;
