/// @ts-check
const Bull = require("Bull");

///con esto se crea un Qeue que manejara las colas de procesos
const characterQueue = new Bull("naruto-character", {
  limiter: {
    max: 1000, //cantidad maxima de procesos que se pueden ejecutar
    duration: 5000, //maximo tiempo de espera antes de poner el proceso en detención
  },
});

//con add agregadamos una tarea a la cola
characterQueue.add({
  identificador: "ilishodionhdaada5d4884d8428482",
  nombre: "naruto",
});

//si le agregamos una key como nombre al proceso este se podra dividir para utilizar distintos workers una tarea a la cola
characterQueue.add("BuscandoHistoria", {
  identificador: "ilishodionhdaada5d4884d8428482",
  nombre: "naruto-2",
});

//Este worker procesa todos los jobs que no contengan un key
characterQueue.process(async (job, done) => {
  console.log("Utilizando Consumer Default", job.data);

  done(null, "success");
});

// Este Worker solo procesa los jobs que tengan el key "BuscandoHistoria"
characterQueue.process("BuscandoHistoria", async (job) => {
  console.log("Utilizando Consumer", job.data);
});

characterQueue.on("completed", (job, result) => {
  console.log(`Job completed with result ${result}`);
});
