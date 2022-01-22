const path = require("path");
const winston = require("winston");
require("winston-daily-rotate-file");

const { combine, timestamp, label, prettyPrint, colorize } = winston.format;

const logPath = (file = "") => path.resolve(path.join(__dirname, `../logs/${file}`));

const transport = new winston.transports.DailyRotateFile({
	filename: "application-%DATE%.log",
	datePattern: "YYYY-MM-DD-HH",
	zippedArchive: true,
	maxSize: "5m",
	maxFiles: "5d",
	dirname: logPath(),
});

const format = combine(label({ label: "Naruto-Server" }), timestamp(), prettyPrint(), colorize());

const logger = winston.createLogger({
	format: format,
	defaultMeta: false,
	transports: [transport],
	exceptionHandlers: [new winston.transports.File({ filename: logPath("exceptions.log") })],
	exitOnError: false,
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== "production") {
	logger.add(
		new winston.transports.Console({
			format: winston.format.simple(),
		})
	);
}

module.exports = logger;
