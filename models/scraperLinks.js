const mongoose = require("mongoose");
const { Schema, SchemaTypes } = mongoose;

const scraperLinks = new Schema({
  proceso: {
    type: SchemaTypes.ObjectId,
    auto: true,
    index: true,
    required: true,
  },
  nombre: {
    type: SchemaTypes.String,
    unique: true,
  },
  link: SchemaTypes.String,
  grupo: SchemaTypes.String,
  fecha: {
    type: SchemaTypes.Date,
    default: new Date(),
  },
  actualizado: {
    type: SchemaTypes.Date,
  },
});

module.exports = mongoose.model("ScraperLinks", scraperLinks);
