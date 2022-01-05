const express = require("express");
const morgan = require("morgan");

const errorController = require("./controllers/errors");

const PORT = process.env.PORT || 3000;

const app = express();

app.use(morgan("dev"));

app.use(errorController.error404);
app.use(errorController.globalError);

app.listen(PORT, () => {
	console.log(`listening on port ${PORT}`);
});
