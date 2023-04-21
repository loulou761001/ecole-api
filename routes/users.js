const express = require("express");
const router = express.Router();
const objectId = require("mongoose").Types.ObjectId;
const bcrypt = require("bcryptjs");
const saltRounds = 10;

const { expressjwt: jwt } = require("express-jwt");
const jwtOptions = { secret: process.env.jwt_SECRET, algorithms: ["HS256"] };

let currentUser;

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const UserModel = require("../models/User");
const middleware = require("../auth/auth");
let slug = require("slug");
const nodemailer = require("nodemailer");
const { json } = require("express");
const jwtoken = require("jsonwebtoken");

// GENERATES A RANDOM TOKEN
function makeToken(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

// GET ALL USERS
router.get("/", jwt(jwtOptions), async (req, res) => {
  UserModel.find()
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      console.log(error);
      res.send(error);
    });
});

// GET 1 USER WITH SLUG
router.get("/:slug", async (req, res) => {
  let data = {};
  const user = await UserModel.aggregate([
    {
      $match: { slug: { $eq: req.params.slug } },
    },
    {
      $lookup: {
        from: "badges",
        let: {
          date: "$badges.unlockedAt",
        },
        localField: "badges.badge",
        foreignField: "_id",
        as: "badges",
        pipeline: [
          {
            $set: { unlockDate: "$$date" },
          },
          {
            $unwind: "$unlockDate",
          },
        ],
      },
    },
    {
      $lookup: {
        from: "badges",
        localField: "featuredBadge",
        foreignField: "_id",
        as: "featuredBadge",
      },
    },
    {
      $project: {
        email: 1,
        username: 1,
        slug: 1,
        badges: 1,
        featuredBadge: 1,
        createdAt: 1,
        banned: 1,
        cigarettes: 1,
        cigInfo: 1,
      },
    },
  ]);
  if (user[0]) {
    if (typeof user[0].cigInfo === "string") {
      user[0].cigInfo = JSON.parse(user[0].cigInfo);
    }
    res.send(user[0]);
  } else res.status(400).send("Aucun utilisateur trouvé.");
});

//REGISTER
router.post("/register", async (req, res) => {
  console.log("register", req);
  req.fields.slug = slug(
    req.fields.first_name.trim() + req.fields.last_name.trim()
  );
  req.fields.confirmationToken = req.fields.last_name + makeToken(30);
  const errors = {};
  let exists;
  console.log("still works");
  let transporter = nodemailer.createTransport({
    // service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "smokehelper1@gmail.com",
      pass: process.env.NODEMAILER_PASS,
    },
  });
  console.log("still works after email");

  // email verif
  if (!emailRegex.test(req.fields.email)) {
    errors.email = "Format d'adresse e-mail invalide.";
  } else {
    exists = await UserModel.isEmailTaken(req.fields.email);
    if (exists) {
      console.log(res);
      errors.email = "Adresse e-mail indisponible.";
    }
  }
  console.log("still works after email verif");

  // name verif
  if (
    !(
      req.fields.first_name &&
      req.fields.last_name &&
      req.fields.first_name.length >= 3 &&
      req.fields.first_name.length <= 46 &&
      req.fields.last_name.length >= 3 &&
      req.fields.last_name.length <= 46
    )
  ) {
    errors.username = "Veuillez entrer entre 3 et 46 caractères.";
  }
  console.log("still works after name verif");

  // verif mdp

  if (
    req.fields.password &&
    req.fields.password.length >= 8 &&
    req.fields.password.length <= 50
  ) {
    if (
      !req.fields.password.match(
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/
      )
    ) {
      errors.password =
        "Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule et un chiffre.";
    }
  } else {
    errors.password = "Veuillez entrer entre 8 et 50 caractères.";
  }

  if (Object.keys(errors).length !== 0) {
    res.status(400).send(errors);
    return;
  }

  // PASSWORD HASH
  bcrypt.hash(req.fields.password, saltRounds, function (err, hash) {
    if (err) {
      res.status(400).send(err);
      return;
    }
    req.fields.password = hash;
    const newUser = new UserModel(req.fields);
    console.log(hash);
    newUser
      .save()
      .then((docs) => {
        const mailConfig = {
          from: "ENT école <smokehelper1@gmail.com>",
          to: req.fields.email,
          subject: "Confirmez votre adresse mail",
          text: "Bonjour",
          html:
            "<p>Bonjour " +
            req.fields.username +
            ", veuillez copier le code ci-dessous pour confirmer votre adresse mail, puis vous connecter à votre compte. Il vous sera demandé d'entrer ce code lors de votre premiere connection.</p><span style='background-color: #55886F;padding: 5px;color: white;font-weight: bold'>" +
            req.fields.confirmationToken +
            "</span>",
        };
        transporter.sendMail(mailConfig, (err, info) => {
          console.log(info);
          if (err) {
            console.log(err);
          }
        });
        res.send(docs);
      })
      .catch((err) => console.log(err));
  });
});

// LOGIN
router.post("/login", async (req, res) => {
  const user = await UserModel.aggregate([
    //   check if email or username exists
    {
      $match: {
        email: { $eq: req.fields.email },
      },
    },
    {
      $set: { id: "$_id" },
    },
    {
      $project: {
        id: 1,
        username: 1,
        slug: 1,
        email: 1,
        confirmed: 1,
        confirmationToken: 1,
        role: 1,
        password: 1,
      },
    },
  ]);
  if (user[0]) {
    bcrypt.compare(
      req.fields.password,
      user[0].password,
      function (err, result) {
        delete user[0].password;
        if (user[0] && result === true) {
          const token = jwtoken.sign(user[0], process.env.jwt_SECRET, {
            algorithm: "HS256",
          });
          currentUser = user[0];
          res.send({ token: token, user: user[0] });
        } else res.status(400).send("Aucun utilisateur trouvé.");
      }
    );
  } else res.status(400).send("Aucun utilisateur trouvé.");
});

// GET USER
router.post(
  "/me",
  jwt({ secret: process.env.jwt_SECRET, algorithms: ["HS256"] }),
  async function (req, res) {
    console.log(currentUser);
    try {
      await res.send({ data: currentUser });
    } catch (e) {
      console.log(e);
    }
  }
);
// CONFIRM MAIL
router.post("/confirmMail/:token", async (req, res) => {
  if (!req.fields.userId || !objectId.isValid(req.fields.userId)) {
    res.status(400).send("Aucun utilisateur spécifié ou ID invalide.");
  }
  if (!req.params.token) {
    res.status(400).send("Aucun token spécifié.");
  }
  const token = req.params.token;
  const userId = objectId(req.fields.userId);
  let userFound = await UserModel.findOneAndUpdate(
    {
      _id: userId,
      banned: false,
      confirmed: false,
      confirmationToken: token,
    },
    {
      $set: {
        confirmed: true,
        confirmationToken: null,
        updatedAt: new Date(),
      },
    }
  );
  if (!userFound) {
    res.status(400).send("Aucun utilisateur trouvé.");
  }
  res.status(200).send({ status: "success", data: userFound });
});

// RESET MDP ETAPE 1
router.get("/resetPassword/:email", async (req, res) => {
  let user = await UserModel.aggregate([
    {
      $match: { email: { $eq: req.params.email } },
    },
    {
      $project: {
        _id: 1,
        username: 1,
        email: 1,
      },
    },
  ]);

  if (user[0]) {
    user = user[0];
    console.log(user);
    const pwToken = makeToken(12);
    UserModel.findByIdAndUpdate(
      user._id,
      { $set: { resetPasswordToken: pwToken } },
      { new: true },
      (err, docs) => {
        if (!err) {
          let transporter = nodemailer.createTransport({
            // service: "gmail",
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              user: "smokehelper1@gmail.com",
              pass: process.env.NODEMAILER_PASS,
            },
          });
          const mailConfig = {
            from: "SmokeHelper <smokehelper1@gmail.com>",
            to: user.email,
            subject: "Réinitialisation de votre mot de passe",
            text: "Bonjour",
            html:
              "<p>Bonjour " +
              user.username +
              ", veuillez copier le code ci-dessous pour changer votre mot de passe.</p><span style='background-color: #55886F;padding: 5px;color: white;font-weight: bold'>" +
              pwToken +
              "</span>",
          };
          transporter.sendMail(mailConfig, (err, info) => {
            console.log(info);
            if (err) {
              console.log(err);
            }
          });
          res.status(200).send({ status: "success", data: user });
        } else res.status(400).send("Erreur durant la mise à jour du profil.");
      }
    );
  } else res.status(400).send("Aucun utilisateur trouvé.");
});

// RESET MDP ETAPE 2
router.put("/checkPasswordToken/:token", async (req, res) => {
  if (!req.fields.userId || !objectId.isValid(req.fields.userId)) {
    res.status(400).send("Aucun utilisateur spécifié ou ID invalide.");
  }
  if (!req.params.token) {
    res.status(400).send("Aucun token spécifié.");
  }
  if (!req.fields.newPw) {
    res.status(400).send("Aucun mdp spécifié.");
  }
  const userId = objectId(req.fields.userId);
  let user = await UserModel.aggregate([
    {
      $match: {
        $and: [
          { _id: { $eq: userId } },
          { resetPasswordToken: { $eq: req.params.token } },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        username: 1,
        email: 1,
      },
    },
  ]);
  if (user[0]) {
    user = user[0];

    // PASSWORD HASH
    bcrypt.hash(req.fields.newPw, saltRounds, function (err, hash) {
      if (err) {
        res.status(400).send(err);
        return;
      }
      const newPass = hash;
      UserModel.findByIdAndUpdate(
        user._id,
        { $set: { resetPasswordToken: "", password: newPass } },
        { new: true },
        (err, docs) => {
          if (!err) {
            res.status(200).send({ status: "success" });
          } else
            res.status(400).send("Erreur durant la mise à jour du profil.");
        }
      );
    });
  } else {
    res.status(400).send("Aucun utilisateur trouvé");
  }
});

// UPDATE
router.put("/:id", (req, res) => {
  if (!objectId.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  const updateItem = req.fields;
  if (typeof updateItem.cigInfo === "string") {
    updateItem.cigInfo = JSON.parse(updateItem.cigInfo);
  }

  UserModel.findByIdAndUpdate(
    req.params.id,
    { $set: updateItem },
    { new: true },
    (err, docs) => {
      if (!err) res.send(docs);
      else console.log("Update error : " + err);
    }
  );
});

// DELETE
router.delete("/:id", (req, res) => {
  if (!objectId.isValid(req.params.id))
    return res.status(400).send("ID unknow ! " + req.params.id);

  UserModel.findByIdAndRemove(req.params.id, (err, docs) => {
    if (!err) res.send(docs);
    else console.log("Delete error : " + err);
  });
});

module.exports = router;
