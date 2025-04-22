const mongoose = require('mongoose');

const examenSchema = new mongoose.Schema({
  nombre: String,
  precio: Number,
  descripcion: String
}, { 
  collection: 'examenes',
  timestamps: true // Agregar timestamps para seguimiento
});

// Middleware para logging
examenSchema.pre('save', function(next) {
  console.log('💾 Guardando examen:', this.nombre);
  next();
});

examenSchema.post('save', function(doc) {
  console.log('✅ Examen guardado:', doc.nombre);
});

examenSchema.post('find', function(docs) {
  console.log('🔍 Exámenes encontrados:', docs.length);
});

examenSchema.post('findOne', function(doc) {
  if (doc) {
    console.log('🔍 Examen encontrado:', doc.nombre);
  } else {
    console.log('❌ Examen no encontrado');
  }
});

module.exports = mongoose.model('Examen', examenSchema);
