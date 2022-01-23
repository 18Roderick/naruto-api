require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URL = process.env.MONGO_URL;
console.log(MONGO_URL);
mongoose.connect(MONGO_URL, { dbName: "naruto" });

mongoose.connection.on("connected", () => {
  console.log("Conexion a mongo");
});

mongoose.connection.on("error", () => {
  console.log("Conexion a mongo");
});

module.exports = mongoose.connection;
