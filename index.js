//EXPRESS
const express = require("express");
const app = express();

//Connection to mongoDB
require("./config/db/conn");

//CORS
const cors = require("cors");
app.use(cors());

const formidableMiddleware = require("express-formidable");

// PASSPORT

// ROUTES
const usersRoute = require("./routes/users");
const classesRoute = require("./routes/classes");

app.use(formidableMiddleware());

app.use("/users", usersRoute);
app.use("/classes", classesRoute);

app.listen(1337, () => {
  console.log("Server is running (port 1337)!");
});
