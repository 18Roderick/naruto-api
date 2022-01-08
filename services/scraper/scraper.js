const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const configUrl = require("./urls");

const NarutoScraper = function () {
	//const ScraperLinks = require("../../models/scraperLinks");
	//const mongoConnection = require("../../models/connection");

	function init() {
		initSearch()
			.then(() => {
				console.log("Finalized");
			})
			.catch(() => {
				console.error("Error initializing");
			});
	}

	async function initSearch() {
		try {
			await searchDictionary(configUrl.urlInicial);
		} catch (error) {}
	}

	async function searchDictionary(url) {
		try {
			const pageHtml = await axios.get(url);
			const $ = cheerio.load(pageHtml.data);

			const data = $(".category-page__members .category-page__member")
				.map(function (i, el) {
					let detalles = $(this).find(".category-page__member-link");
					let nombre = detalles.text();
					let link = detalles.attr("href");
					return {
						nombre,
						link: `${configUrl.urlBase}${link}`,
					};
				})
				.get();

			//data.shift();
			console.log("Tamaño ", data.length);

			//datosObtenidos.personajes = data;
			//datosObtenidos.nextPage = nextPageUrl;

			await searchCharacterInfo(data[0].link);

			return;
		} catch (error) {
			console.error(error);
		}
	}

	async function searchPage() {}
	async function searchCharacterInfo() {}

	async function searchCharacterInfo(url) {
		try {
			const pageHtml = await axios.get(url);
			console.log(url);
			const datos = {};
			const $ = cheerio.load(pageHtml.data);
			let containerInfo = cheerio.load($(".mw-parser-output").html(), null, false);
			["div", "section", "table", "p", "aside", "h2", "ul", "center", "figure"].forEach((tag) => {
				containerInfo(tag).remove();
			});
			datos.introduccion = extractTextFromHtml(containerInfo.text());
			datos.image = $(".wds-tab__content .pi-image a").attr("href");

			const detalles = $("aside .pi-item.pi-group.pi-border-color");
			datos.detalles = avoidInfo($);

			saveFile(datos);
			return datos;
		} catch (error) {
			console.error("Error Buscando Info de Personaje", error);
		}
	}

	function avoidInfo(html) {
		const avoid = ["debut", "doblaje"];

		const $ = html; //cheerio.load(html, null, false);

		const datos = $("aside .pi-item.pi-group.pi-border-color")
			.map(function (_, tag) {
				let title = eliminarDiacriticos($(this).find("h2").text().trim().toLowerCase() || "");
				title = toSnakeCase(title);
				let dto = {};
				if (title != avoid[0] && title != avoid[1]) {
					dto = $(this)
						.find(".pi-item.pi-data.pi-item-spacing.pi-border-color")
						.map(function (_, tag2) {
							//console.log($(tag2).has());
							//let info = $(this).find(".pi-item.pi-data.pi-item-spacing.pi-border-color");
							let titulo = $(this).find("h3").text().trim();

							let value = $(this).find("div").text().trim();

							//si no tiene titulo h3 entonces buscarlo en sus contenedor
							titulo = (titulo || $(this).data("source")).toLowerCase();
							titulo = toSnakeCase(eliminarDiacriticos(titulo));
							//pi-data-value pi-font
							//console.log(title, $(this).data("source"));
							let lista = buscarJutsus($(tag2).html());
							//console.log(titulo, lista);
							return lista.length > 1
								? lista
								: {
										[titulo]: value,
								  };
						})
						.get();
					//console.log(title, dto);
					return {
						[title]: flatDatosNombre(dto),
					};
				}
			})
			.get();

		return flatDatosNombre(datos);
	}

	function buscarJutsus($) {
		$ = cheerio.load($, null, false);
		return $("a")
			.map(function (_, tag3) {
				return $(this).text().trim() ? $(this).text() : null;
			})
			.get();
	}

	function flatDatosNombre(dto) {
		let flatDatos = {};
		let flatArray = [];
		const fnHasDto = (el) => typeof el !== "string";

		if (!Array.isArray(dto) && !dto.some(fnHasDto)) return dto;

		for (const currentKey in dto) {
			if (typeof dto[currentKey] !== "string") {
				flatDatos = {
					...flatDatos,
					...dto[currentKey],
				};
			} else {
				//TODO mejorar adquisición de datos en información
				let name = /(\b)[a-zA-Z0-9]{3,8}(\b)/.exec(dto[currentKey]);
				name = Array.isArray(name) ? name[0] : Date.now().toLocaleString();
				name = eliminarDiacriticos(name);
				flatArray.push(dto[currentKey]);
			}
		}

		let size = Object.keys(flatDatos).length;

		return flatArray.length > size ? flatArray : flatDatos;
	}

	function cleanSizeHeight(str) {
		//funcion para limpiar datos de altura y peso
		const rgx = /[^(kgm0-9.)\s]/gm;
		return typeof str === "string" ? str.replace(rgx, "").trim() : str;
	}

	function extractTextFromHtml(html) {
		let text = html.replace(/^\s+/, "").replace(/\s+$/, "").replace(/\s+/g, " ");

		return String(text);
	}
	function toSnakeCase(str) {
		const rgx = /\s+/g;
		return String(str).replace(rgx, "_");
	}

	function eliminarDiacriticos(texto) {
		return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	}

	function saveFile(datos, name = "naruto.json") {
		fs.writeFileSync(path.join(__dirname, `../../files/${name}`), JSON.stringify(datos));
	}

	return {
		init: init,
	};
};

const naruto = new NarutoScraper();

naruto.init();
module.exports = NarutoScraper;
