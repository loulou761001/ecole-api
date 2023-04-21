const mongoose = require("mongoose");
require("dotenv").config();
console.log(process.env);
console.log("Connection ");
mongoose.connect(
    process.env.ATLAS_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
).then(()=>{
    console.log('connexion success')
}).catch((err)=>{console.log("Connection error :" + err)});
