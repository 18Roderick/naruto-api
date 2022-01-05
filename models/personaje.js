const {Schema}, mongoose = require("mongoose");

const habilidadSchema = new Schema({

})

const personajeSchema = new Schema({
    id: {
        type: mongoose.Types.ObjectId,
        index:true,
    },
    nombre: String,
    habilidades:[habilidadSchema],
    apariencia:String,
})


module.exports = mongoose.model('Personaje', personajeSchema);
