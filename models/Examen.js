const mongoose = require('mongoose');

const examenSchema = new mongoose.Schema({
  nombre: String,
  precio: Number,
  descripcion: String
});

module.exports = mongoose.model('Examen', examenSchema);
