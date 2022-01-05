const createError = require("http-errors");

module.exports.error404 = (req, res, next) => {
	res.status(404).json(new createError.NotFound("url solicitada no existe"));
};

module.exports.globalError = (err, req, res) => {
	console.error(err.message);
	res.status(500).json(new createError.InternalServerError("Error de servidor"));
};
