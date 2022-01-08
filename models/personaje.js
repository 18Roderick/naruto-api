const mongoose = require("mongoose");
const { Schema, SchemaTypes } = mongoose;

const habilidadSchema = new Schema({});

const informacionSchema = new Schema({});

const nombreSchema = new Schema({});

const personajeSchema = new Schema({
	id: {
		type: SchemaTypes.ObjectId,
		index: true,
	},
	nombre: nombreSchema,
	jutsus: {
		type: [String],
		default: [],
	},
	apariencia: String,
});

module.exports = mongoose.model("Personaje", personajeSchema);
