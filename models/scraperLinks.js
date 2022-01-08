const mongoose = require("mongoose");
const { Schema, SchemaTypes } = mongoose;

const scraperLinks = new Schema({
	id: {
		type: SchemaTypes.ObjectId,
		auto: true,
		index: true,
		required: true,
	},
	nombre: SchemaTypes.String,
	link: SchemaTypes.String,
	fecha: {
		type: SchemaTypes.Date,
		default: new Date(),
	},
});

module.exports = mongoose.model("ScraperLinks", scraperLinks);
