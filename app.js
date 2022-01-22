const fastify = require("fastify")({ logger: true });

const PORT = process.env.PORT || 3000;

//app.set("trust proxy", true);

// Declare a route
fastify.register(require("./routes/narutoRoute"));

// Run the server!
const start = async () => {
	try {
		await fastify.listen(PORT);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};
start();
