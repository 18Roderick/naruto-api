const mongoose = require("mongoose");
const { Schema, SchemaTypes } = mongoose;

const taskSchema = new Schema({
	id: SchemaTypes.ObjectId,
	nombre: SchemaTypes.String,
	description: SchemaTypes.String,
	fechaInicio: SchemaTypes.Date,
	fechaFinal: SchemaTypes.Date,
});

module.exports = mongoose.model("Task", taskSchema);
