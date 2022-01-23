// @ts-check
const axios = require("axios").default;
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const { createHash } = require("crypto");

const scraperLinks = require("../../models/scraperLinks");

const logger = require("../logger");
const configUrl = require("./urls");

const hash = createHash("sha256");

const NarutoScraper = function () {
  // const ScraperLinks = require("../../models/scraperLinks");
  // const mongoConnection = require("../../models/connection");
  let connection;

  async function initSearch() {
    try {
      await searchDictionary(configUrl.personajes);
    } catch (error) {
      console.error("error");
      logger.error(error);
    }
  }

  async function searchDictionary(url) {
    try {
      const pageHtml = await axios.get(url);
      const $ = cheerio.load(pageHtml.data);
      let nextPageUrl = $(".category-page__pagination-next").attr("href");
      const data = $(".category-page__members .category-page__member")
        .map(function () {
          const detalles = $(this).find(".category-page__member-link");
          const nombre = detalles.text().trim();
          const link = detalles.attr("href");
          return {
            nombre,
            link: `${configUrl.urlBase}${link}`,
            grupo: nombre[0],
          };
        })
        .get();

      data.shift();
      console.log("Tamaño ", data.length);

      // datosObtenidos.nextPage = nextPageUrl;
      saveFile(data);
      await saveLink(data); // searchCharacterInfo(data[0].link);
      console.log("nextUrl  ", nextPageUrl);
      return [data, nextPageUrl];
    } catch (error) {
      logger.error(error);
    }
  }

  async function searchCharacterInfo(url) {
    try {
      const pageHtml = await axios.get(url);
      console.log(url);
      let datos = {};
      const $ = cheerio.load(pageHtml.data);
      const containerInfo = cheerio.load($(".mw-parser-output").html(), null, false);
      ["div", "section", "table", "p", "aside", "h2", "ul", "center", "figure"].forEach((tag) => {
        containerInfo(tag).remove();
      });
      datos.introduccion = extractTextFromHtml(containerInfo.text());
      datos.image = $(".wds-tab__content .pi-image a").attr("href");

      const detalles = searchDetails($); //$("aside .pi-item.pi-group.pi-border-color");

      datos.identificador = createHashId(detalles.nombre);

      datos = { ...datos, ...detalles };

      saveFile(datos);
      return datos;
    } catch (error) {
      console.error("Error Buscando Info de Personaje", error);
    }
  }

  function getConnection() {
    connection = require("../../models/connection");
  }

  function searchDetails(html) {
    const avoid = ["debut", "doblaje"];
    const familia = "familia";

    const $ = html; // cheerio.load(html, null, false);

    const datos = $("aside .pi-item.pi-group.pi-border-color")
      .map(function () {
        let title = eliminarDiacriticos($(this).find("h2").text().trim().toLowerCase() || "");
        title = toSnakeCase(title);
        let dto = {};
        if (title != avoid[0] && title != avoid[1]) {
          dto = $(this)
            .find(".pi-item.pi-data.pi-item-spacing.pi-border-color")
            .map(function (_, tag2) {
              // console.log($(tag2).has());
              // let info = $(this).find(".pi-item.pi-data.pi-item-spacing.pi-border-color");
              let titulo = $(this).find("h3").text().trim();

              const value = $(this).find("div").text().trim();

              // si no tiene titulo h3 entonces buscarlo en sus contenedor
              titulo = (titulo || $(this).data("source")).toLowerCase();
              titulo = toSnakeCase(eliminarDiacriticos(titulo));
              // pi-data-value pi-font
              // console.log(title, $(this).data("source"));

              const lista =
                titulo === familia
                  ? buscarFamiliares($(tag2).html())
                  : buscarJutsus($(tag2).html());

              return lista.length > 1
                ? lista
                : {
                    [titulo]: value,
                  };
            })
            .get();

          //formatear datos si son distintos de familia
          let formatData = title === familia ? dto : flatDatosNombre(dto);

          return {
            [title]: formatData,
          };
        }
      })
      .get();

    return flatDatosNombre(datos);
  }

  function buscarFamiliares(html) {
    let $ = cheerio.load(html, null, false);
    let parentes = [...$.text().match(/\((.*?)\)/g)];

    parentes.map((s, i) => {
      let str = s.replace("(", "").replace(")", "");
      //forzar reemplazo
      parentes[i] = str;
      return str;
    });

    return $("a")
      .map(function (i) {
        let familiar = $(this).text();
        return {
          familiar,
          parentesco: parentes[i],
        };
      })
      .get();
  }

  function buscarJutsus($) {
    $ = cheerio.load($, null, false);
    return $("a")
      .map(function () {
        return $(this).text().trim() ? $(this).text() : null;
      })
      .get();
  }

  function flatDatosNombre(dto) {
    let flatDatos = {};
    const flatArray = [];
    const fnHasDto = (el) => typeof el !== "string";

    ///objeto con los keys que no se formatearan a un solo objeto

    if (!Array.isArray(dto) && !dto.some(fnHasDto)) return dto;

    for (const currentKey in dto) {
      //verificar que el dato no sea un string o que pertenezca a la lista de keys que no se formatean
      if (typeof dto[currentKey] !== "string") {
        dto[currentKey] = formatDetails(dto[currentKey]);

        flatDatos = {
          ...flatDatos,
          ...dto[currentKey],
        };
      } else {
        // TODO mejorar adquisición de datos en información

        let rgx = /(\b)[a-zA-Z0-9]{3,8}(\b)/.exec(dto[currentKey]);
        let name = Array.isArray(rgx) ? rgx[0] : Date.now().toLocaleString();
        name = eliminarDiacriticos(name);
        flatArray.push(dto[currentKey]);
      }
    }

    const size = Object.keys(flatDatos).length;

    return flatArray.length > size ? flatArray : flatDatos;
  }

  function formatDetails(dto) {
    const optionsToformat = {
      edad: "edad",
      peso: "peso",
      altura: "altura",
    };

    if (optionsToformat.peso in dto) {
      dto[optionsToformat.peso] = cleanSizeHeight(dto[optionsToformat.peso]);
    }

    if (optionsToformat.altura in dto) {
      dto[optionsToformat.altura] = cleanSizeHeight(dto[optionsToformat.altura]);
    }

    if (optionsToformat.edad in dto) {
      dto[optionsToformat.edad] = extractAge(dto[optionsToformat.edad]);
    }

    return dto;
  }

  function cleanSizeHeight(str) {
    // funcion para limpiar datos de altura y peso
    const rgx = /(\d+).?(\d+).?(\d*)\s*(m|cm|km|kg)/gm;
    const searchTest = rgx.exec(str);
    if (searchTest.length > 0) return String(searchTest[0]).trim();

    return str;
  }

  function extractAge(str) {
    if (!str) return str;
    const arrayEdad = str.split(/(\d+)+/g).filter((n) => !isNaN(n));

    return Math.max(...arrayEdad);
  }

  function extractTextFromHtml(html) {
    const text = html.replace(/<[^>]*>/g); // replace(/^\s+/, "").replace(/\s+$/, "").replace(/\s+/g, " ");

    return String(text);
  }
  function toSnakeCase(str) {
    const rgx = /\s+/g;
    return String(str).replace(rgx, "_");
  }

  function createHashId(dto) {
    let str = Object.keys(dto).join().replace(/s+/g, "");
    hash.update(str);
    return hash.digest("hex");
  }

  function eliminarDiacriticos(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function saveFile(datos, name = "naruto.json") {
    const fileName = path.join(__dirname, `../../files/${name}`);

    if (!fs.existsSync(fileName)) return fs.writeFileSync(fileName, JSON.stringify(datos));

    let file = fs.readFileSync(fileName, { encoding: "utf8" });
    file = JSON.parse(file);

    let arr = Array.from(file);

    if (process.env.NODE_ENV !== "production") arr = [...arr, ...datos];

    fs.writeFileSync(fileName, JSON.stringify(arr));
  }

  async function saveLink(arrayLinksDto) {
    try {
      await scraperLinks.insertMany(arrayLinksDto);
    } catch (e) {
      logger.error(e.message);
    }
  }

  function init() {
    logger.info("Iniciando Proceso NarutoScraper");

    getConnection();

    connection.on("connected", function () {
      initSearch()
        .then(() => {
          logger.info("Finalizando Proceso NarutoScraper");
        })
        .catch(() => {
          console.error("Error initializing");
        })
        .finally(() => {
          connection.close();
        });
    });
  }

  return {
    init,
  };
};

const naruto = NarutoScraper();

naruto.init();
module.exports = NarutoScraper;
