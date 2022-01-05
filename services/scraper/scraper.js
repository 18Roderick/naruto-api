const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const configUrl = require("./urls");

class NarutoScraper {
	constructor(config) {}
}

async function test() {
	try {
		const pageHtml = await axios.get(configUrl.personajes);
		const $ = cheerio.load(pageHtml.data);
		let datosObtenidos = {};

		const nextPageUrl = $(".category-page__pagination .category-page__pagination-next").attr(
			"href"
		);
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

		data.shift();
		data.length = 5;
		let detalles = await getPersonajeInfo(data[3].link);
		datosObtenidos.personajes = data;
		datosObtenidos.nextPage = nextPageUrl;
		datosObtenidos.detalles = detalles;
		saveFile(datosObtenidos);
	} catch (error) {
		console.error(error);
	}
}

/* 
    mw-parser-output

    acceso a imagen
    pi-item pi-image img src
*/

async function getPersonajeInfo(url) {
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
			let title = eliminarDiacriticos($(this).find("h2").text().trim().toLowerCase());
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
						console.log(titulo, lista);
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
	const fnHasDto = (el) => typeof el !== "string";
	return Array.isArray(dto) && dto.some(fnHasDto)
		? dto.reduce((prev, current, index) => {
				if (typeof current === "string") {
					let name = /(\b)[a-zA-Z0-9]{3,8}(\b)/.exec(current);
					name = Array.isArray(name) ? name[0] : index;
					name = eliminarDiacriticos(name);
					return { ...prev, [name]: current };
				} else {
					return { ...prev, ...current };
				}
		  })
		: dto;
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

test();
