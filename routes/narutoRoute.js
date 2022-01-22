async function routes(fastify, options) {
	fastify.get("/", async (req, rep) => {
		return { msg: "Naruto" };
	});
}

module.exports = routes;
