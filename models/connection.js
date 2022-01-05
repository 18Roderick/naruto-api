require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL);

module.exports = mongoose.connection;
